# Honeydew

A lightweight worker class to automate promise-returning tasks with NO dependencies.

## Installation

`npm i honeydew`

## Usage

```
    const { Worker } = require('honeydew');

    const findTask = () => {
        // this will generally be a database query
        // to find relevant work to be done
        return db.Requests.findOne({status:'Queued'}).then(request=>{
             // this promise must return an object with an execute function
             // that itself returns a promise of the work to be done
            const task = {
                execute: () => {  
                    return VendorAPI.post(request).then(res => {
                        const response = Object.assign({}, res, { request: request._id});
                        return db.Responses.create(response);
                    });
                }
            };
            return task;
        })
    }
```

## Tests

`npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
