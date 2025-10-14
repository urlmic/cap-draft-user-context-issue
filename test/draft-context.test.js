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

  test('Query draft programmatically (loses user context)', async () => {
    const srv = await cds.connect.to('CatalogService');
    const { Books } = srv.entities;

    // This query fails because it uses 'anonymous' user instead of 'alice'
    const draft = await srv.run(SELECT.from(Books.drafts).where({ ID: draftID }));

    console.log('Draft found:', draft);
    expect(draft).toBeDefined(); // This will fail!
    expect(draft.length).toBe(1);
  });

  test('Query draft via OData (keeps user context)', async () => {
    // This works fine because the HTTP request carries 'alice' user context
    const { data } = await axios.get(`/odata/v4/catalog/Books(ID=${draftID},IsActiveEntity=false)`);

    expect(data).toBeDefined();
    expect(data.IsActiveEntity).toBe(false);
  });
});
