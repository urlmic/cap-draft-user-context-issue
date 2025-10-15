const cds = require('@sap/cds');

describe('Draft User Context Issue', () => {
  const { axios } = cds.test(__dirname + '/..');

  let draftID;

  // Authenticate as 'alice' user
  axios.defaults.auth = { username: 'alice', password: 'alice' };

  test('Create draft via OData (authenticated as alice)', async () => {
    const { data } = await axios.post('/odata/v4/catalog/Books', {
      title: 'Test Book',
      author: 'Test Author'
    });

    expect(data.IsActiveEntity).toBe(false);
    expect(data.HasActiveEntity).toBe(false);
    draftID = data.ID;
  });

  test('Query draft programmatically - Option 1: Create user context', async () => {
    const srv = await cds.connect.to('CatalogService');
    const { Books } = srv.entities;

    // Option 1: Create a transaction with user context
    const draft = await srv.tx({ user: new cds.User.Privileged({ id: 'alice' }) }, async (tx) => {
      return tx.run(SELECT.from(Books.drafts).where({ ID: draftID }));
    });

    console.log('Draft found (with user context):', draft);
    expect(draft).toBeDefined();
    expect(draft.length).toBe(1);
  });

  test('Query draft programmatically - Option 2: Use database layer', async () => {
    const srv = await cds.connect.to('CatalogService');
    const { Books } = srv.entities;

    // Option 2: Access drafts directly via database layer (bypasses service-level user filtering)
    // Use service entity for reflection, but query against cds.db
    const draft = await cds.db.run(
      SELECT.from(Books.drafts).where({ ID: draftID })
    );
    
    console.log('Draft found (via db layer):', draft);
    expect(draft).toBeDefined();
    expect(draft.length).toBe(1);
  });

  test('Query draft via OData (keeps user context)', async () => {
    // This works fine because the HTTP request carries 'alice' user context
    const { data } = await axios.get(`/odata/v4/catalog/Books(ID=${draftID},IsActiveEntity=false)`);

    expect(data).toBeDefined();
    expect(data.IsActiveEntity).toBe(false);
  });
});
