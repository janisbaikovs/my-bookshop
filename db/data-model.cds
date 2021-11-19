namespace my.bookshop;
using { sap.common.Countries, sap.common.CodeList, managed, cuid } from '@sap/cds/common';

entity Regions : CodeList {
  key code : String(5); // ISO 3166-2 alpha5 codes, e.g. DE-BW
  country  : Association to Countries;
}

extend Countries {
  numcode : Integer; //> ISO 3166-1 three-digit numeric codes
  regions : Composition of many Regions on regions.country = $self; // bi-directionally associate Regions with Countries
}

type Country : Association to Countries { numcode };

entity Books {
  key ID : Integer;
  title  : localized String;
  author : Association to Authors;
  stock  : Integer;
}

entity Authors {
  key ID : Integer;
  name   : String;
  books  : Association to many Books on books.author = $self;
}

entity Orders : managed {
  key ID  : Integer;
  book    : Association to Books;
  country : Country;
  amount  : Integer;
}

entity PurchaseOrders : managed, cuid {
  book    : Association to Books;
  amount  : Integer;
  approved : Boolean;
  inboundDeliveries : Association to InboundDelivery;
}

entity InboundDelivery : cuid {
  amount  : Integer;
  purchaseOrder : Association to one PurchaseOrders on purchaseOrder.inboundDeliveries = $self;
}