const rest = require('eonc-rest');

// Customer table
let customers = {
  1: {
    name: 'John Marvell',
    phone: '555-1234567',
    balance: 0,
    note: 'Some note'
  }
};

// create the endpoint (api)
const ep = rest.endpoint();

// Handle Http GET method
ep.onGet('id:ns1:id', function(req, res) {
  const record = customers[req.params.id];
  if (!record)
    throw new rest.HttpError(400, 'Record not found');
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(record));
});

// Handle Http PUT method
ep.onPut('id:ns1:id; name:ns1:name; phone:ns1:phonenumber; note:string',
    function(req, res) {
      const record = customers[req.params.id] || {};
      record.name = req.params.name;
      record.phone = req.params.phone;
      record.note = req.params.note;
      customers[req.params.id] = record;
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
        onValidate: function(typ, val) {
          // You can validate and modify value here
          return val + ' (validated)';
        }
      }
    },
    function(req, res) {
      const record = customers[req.params.id] || {};
      if (req.params.name)
        record.name = req.params.name;
      if (req.params.phone)
        record.phone = req.params.phone;
      if (req.params.note)
        record.note = req.params.note;
      customers[req.params.id] = record;
      res.end('Record updated');
    });

// Handle Http DELETE method
ep.onDelete('id:ns1:id', function(req, res) {
  const record = customers[req.params.id];
  if (!record)
    throw new rest.HttpError(400, 'Record not found');
  delete customers[req.params.id];
  res.end('Record deleted');
});

module.exports = ep;
