namespace my.bookshop;

entity Books {
  key ID     : UUID;
      title  : String(100);
      author : String(100);
}
