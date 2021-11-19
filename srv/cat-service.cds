using my.bookshop as my from '../db/data-model';

service CatalogService {

  entity Books @readonly as projection on my.Books;
  entity Authors @readonly as projection on my.Authors;
  entity Orders as projection on my.Orders;

  @Capabilities: { 
    InsertRestrictions.Insertable: true,
    UpdateRestrictions.Updatable: true,
    DeleteRestrictions.Deletable: false  
  }
  entity PurchaseOrders as projection on my.PurchaseOrders;

  entity InboundDelivery @insertonly as projection on my.InboundDelivery;

  action approvePurchaseOrder(id: UUID) returns String;
}