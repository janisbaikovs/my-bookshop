module.exports = (srv) => {

    const {Books, PurchaseOrders, Authors, Orders} = cds.entities ('my.bookshop')
    const {Countries} = cds.entities ('sap.common')

    srv.reject ('READ', 'Orders');

    srv.on('error', (err, req) => {
        err.message = 'Oh no! ' + err.message;
    });

    // Reduce stock of ordered books
    srv.before ('CREATE', 'Orders', async (req) => {
        const order = req.data
        if (!order.amount || order.amount <= 0)  return req.error (400, 'Order at least 1 book')
        const tx = cds.transaction(req)
        const affectedRows = await tx.run (
            UPDATE (Books)
                .set   ({ stock: {'-=': order.amount}})
                .where ({ stock: {'>=': order.amount},/*and*/ ID: order.book_ID})
        )
        if (affectedRows === 0)  req.error (409, "Sold out, sorry")
    })

    srv.on('READ', 'Orders/country', async req => {
        //const orderID = req.query.SELECT.from.ref[0].where[2].val;

        const [orderID] = req.params

        const tx = cds.transaction(req);
        const order = await tx.read(Orders, orderID, 'country_numcode');

        if(!order.country_numcode) return;

        const countries = await tx.read(Countries).where({numcode:order.country_numcode})

        return countries[0];
    });

    srv.after('READ', 'Orders', (orders, req) => {
        const columns = req.query.SELECT.columns;
        let expands = {count:0};

        columns.forEach(column => {
            if(column.expand) { 
                expands[column.ref[0]] = column.ref[0];
                expands.count += 1;
            }
        });

        if(expands.count === 0) return;

        const tx = cds.transaction(req);

        const readCountries = async (order) => {
            if(expands['country'] && order.country === null) {
                order.country = await tx.read(Countries).where({numcode:order.country_numcode})
            }
        };

        if(Array.isArray(orders)) {
            orders.forEach(order => readCountries(order));
        } else {
            readCountries(orders);
        }
        
    });

     /* srv.on('READ', 'Countries', async (req, next)=> {
        let orderID; // = req.query.SELECT.from.ref[0].where[2].val;

        const ref = req.query.SELECT.from.ref;

        // For navigation from Orders
        for(let i = 0; i < ref.length; i++) {
            if(ref[i].id && ref[i].id.substring(ref[i].id.lastIndexOf('.') + 1) === 'Orders') {
                orderID = ref[i].where[2].val;
                break;
            } 
        }

        if(!orderID) return await next();

        const tx = cds.transaction(req);
        const order = await tx.read(Orders, orderID, 'country_numcode');

        if(!order.country_numcode) return;

        const countries = await tx.read(Countries).where({numcode:order.country_numcode})

        return countries[0];
    }); */
 
    // Add some discount for overstocked books
    srv.after ('READ', 'Books', each => {
        if (each.stock > 111)  each.title += ' -- 11% discount!'
    })

    srv.before('CREATE', 'PurchaseOrders', async req => {
        const data = req.data;
        if(!data.book_ID || !data.amount) return req.error(400, 'Please provide Book ID and amount')

        const tx = cds.transaction(req);

        const bookId = await tx.read(Books, data.book_ID, 'ID');

        if(!bookId) return req.error(400, 'Book doesnot exist')
    })

    srv.on("approvePurchaseOrder", async req => {
        const {id} = req.data;
        if (!id)  return req.error (400, 'Please provide Purchase Order ID')
        const tx = cds.transaction(req);

        const purchaseOrderId = await tx.read(PurchaseOrders, id, 'ID');
        
        if(!purchaseOrderId) return req.error (400, 'Purchase Order does not esxist');

        const affectedRows = await tx.run (
            UPDATE (PurchaseOrders)
                .set   ({ approved: true})
                .where ( purchaseOrderId )
        )

        if (affectedRows === 0)  req.error (409, "Cannot approve Purchase Order")
    })
   
}