using my.bookshop from '../db/schema';

service CatalogService {
  @odata.draft.enabled
  entity Books as projection on bookshop.Books;
}
