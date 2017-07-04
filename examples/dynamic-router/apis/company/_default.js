const rest = require('eonc-rest');

// Company table
const companies = {
  1: {
    name: 'My Company',
    phone: '555-1234567',
    balance: 0,
    note: 'Some note'
  }
};

// create the endpoint (api)
const ep = rest.endpoint();

// Handle Http GET method
ep.onGet('id:ns1:id', async (req, res) => {
  throw new Error('aaaaaa');
  const record = companies[req.params.id];
  if (!record)
    throw new rest.HttpError(400, 'Record not found');
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(record));
});

// Handle Http PUT method
ep.onPut('id:ns1:id; name:ns1:name; phone:ns1:phonenumber; note:string',
    function(req, res) {
      const record = companies[req.params.id] || {};
      record.name = req.params.name;
      record.phone = req.params.phone;
      record.note = req.params.note;
      companies[req.params.id] = record;
      res.end('Record created');
    });

// Handle Http PATCH method
ep.onPatch({
      id: 'ns1:id',
      name: 'ns1:name?',
      phone: 'ns1:phonenumber?',
      note: {
        type: 'string',
        optional: true,
        onValidate: function(val, typ) {
          // You can validate and modify value here
          return val + ' (validated)';
        }
      }
    },
    function(req, res) {
      const record = companies[req.params.id] || {};
      if (req.params.name)
        record.name = req.params.name;
      if (req.params.phone)
        record.phone = req.params.phone;
      if (req.params.note)
        record.note = req.params.note;
      companies[req.params.id] = record;
      res.end('Record updated');
    });

// Handle Http DELETE method
ep.onDelete('id:ns1:id', function(req, res) {
  const record = companies[req.params.id];
  if (!record)
    throw new rest.HttpError(400, 'Record not found');
  delete companies[req.params.id];
  res.end('Record deleted');
});

module.exports = ep;
