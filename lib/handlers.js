var _data = require('./data.js');
var _helpers = require('./helpers.js');


var handlers = {}

handlers.ping = function (data, callback) {
    callback(200);
}

handlers.users = function (data, callback) {
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method.toLowerCase()) > -1){
        handlers._users[data.method.toLowerCase()](data,callback);
    } else {
        callback(405); // 405: NOT ALLOWED
    }
}

// USER SERVICES
handlers._users = {};
handlers._users.post = function (data, callback) {
    var firstName = typeof(data.payload.firstName) === 'string' && 
        data.payload.firstName.trim().length > 0 
        ? data.payload.firstName.trim().toLowerCase() 
        : false;
    var lastName = typeof(data.payload.lastName) === "string" &&
      data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim().toLowerCase()
        : false; 
    var password = typeof(data.payload.password) === "string" &&
        data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false; 

    var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, firstName, lastName, function (tokenIsValid) {
        if (tokenIsValid) {
            if (firstName && lastName && password) {
                _data.read('users', firstName + '_' + lastName, function (err, data) {
                    if (err) {
                        var securePassword = _helpers.hash(password);
                        if (securePassword) {
                            var user = {
                                'firstName': firstName,
                                'lastName': lastName,
                                'securePassword': securePassword
                            }
                            _data.create('users', firstName + '_' + lastName, user, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { 'Error': 'Couldn\'t add a new user!' });
                                }
                            })
                        } else {
                            callback(500, { 'Error': 'User password could not be hashed!' });
                        }

                    } else {
                        callback(400, { 'Error': 'A user with that name already exists!' });
                    }
                })
            } else {
                callback(500, { 'Error': 'Missing required fields' });
            }
        } else {
            callback(403, { 'Error': 'Invalid token' });
        }
    })
}

handlers._users.put = function (data, callback) {
    var firstName = typeof (data.payload.firstName) === 'string' &&
        data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim().toLowerCase()
        : false;
    var lastName = typeof (data.payload.lastName) === "string" &&
        data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim().toLowerCase()
        : false;
    var password = typeof (data.payload.password) === "string" &&
        data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false; 

    var combinedName = firstName + '_' + lastName;

    var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, firstName, lastName, function (tokenIsValid) {
        if (tokenIsValid) {
            if (firstName && lastName) {
                if (password) {
                    _data.read('users', combinedName, function (err, userData) {
                        if (!err && userData) {
                            if (password) {
                                userData.securePassword = _helpers.hash(password);
                            }
                            _data.update('users', combinedName, userData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'Error': 'Couldn\'t update user' });
                                }
                            })
                        } else {
                            callback(400, { 'Error': 'User does not exist!' });
                        }
                    })
                }
            } else {
                callback(400, { 'Error': 'Required fields missing!' });
            }
        } else {
            callback(403, { 'Error': 'Invalid token' });
        }
    });
}

handlers._users.get = function (data, callback) {
    var firstName = typeof (data.query.firstName) === 'string' &&
        data.query.firstName.trim().length > 0
        ? data.query.firstName.trim().toLowerCase()
        : false;
    var lastName = typeof (data.query.lastName) === "string" &&
        data.query.lastName.trim().length > 0
        ? data.query.lastName.trim().toLowerCase()
        : false; 

    var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token,firstName,lastName,function(tokenIsValid){
        if(tokenIsValid){
            var combinedName = firstName + '_' + lastName;
            if (firstName && lastName) {
                _data.read('users', combinedName, function (err, data) {
                    if (!err && data) {
                        delete data.securePassword;
                        callback(200, data);
                    } else {
                        callback(500, { 'Error': 'There was no such user!' });
                    }
                })
            } else {
                callback(400, { 'Error': 'Missing Required Field!' });
            }
        } else {
            callback(403, {'Error':'Invalid token'});
        }
    })
}



handlers._users.delete = function (data, callback) {
    var firstName = typeof (data.query.firstName) === 'string' &&
        data.query.firstName.trim().length > 0
        ? data.query.firstName.trim().toLowerCase()
        : false;
    var lastName = typeof (data.query.lastName) === "string" &&
        data.query.lastName.trim().length > 0
        ? data.query.lastName.trim().toLowerCase()
        : false;

    var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, firstName, lastName, function (tokenIsValid) {
        if (tokenIsValid) {
            var combinedName = firstName + '_' + lastName;
            if (firstName && lastName) {
                _data.read('users', combinedName, function (err, data) {
                    if (!err && data) {
                        _data.delete('users', combinedName, function (err) {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': 'Could not delete the user details' });
                            }
                        })
                    } else {
                        callback(500, { 'Error': 'There was no such user!' });
                    }
                })
            } else {
                callback(400, { 'Error': 'Missing Required Field!' });
            }
        } else {
            callback(403, { 'Error': 'Invalid token' });
        }
    })
}

// USER SERVICES END;

// TOKEN SERVICES START

handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method.toLowerCase()) > -1) {
        handlers._tokens[data.method.toLowerCase()](data, callback);
    } else {
        callback(405); // 405: NOT ALLOWED
    }


}

handlers._tokens = {};

handlers._tokens.verifyToken = function(id,firstName,lastName,callback){
    _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
            if(tokenData.firstName === firstName && tokenData.lastName === lastName && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {    
            callback(false);
        }
    })
}

handlers._tokens.post = function(data, callback){
    var firstName =
      typeof(data.payload.firstName) === "string" &&
      data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim().toLowerCase()
        : false;
    var lastName =
      typeof(data.payload.lastName) === "string" &&
      data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim().toLowerCase()
        : false;

    var password =
        typeof(data.payload.password) === "string" &&
            data.payload.password.trim().length > 0
            ? data.payload.password.trim()
            : false;
    
    var combinedName = firstName+ '_' + lastName;
    if( firstName && lastName && password){
        _data.read('users',combinedName,function(err,userData){
            if(!err && userData){
                if(_helpers.hash(password) === userData.securePassword){
                    var tokenid = _helpers.createRandomString(20);
                    var expires = Date.now() + 1000*60*60;
                    var tokenObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'expires': expires
                    }
                    _data.create('tokens',tokenid,tokenObject,function(err) {
                        if(!err){
                            callback(200,tokenObject);
                        } else {
                            callback(500,{'Error':'Could not create a token!'});
                        }
                    })
                } else{
                    callback(400,{'Error':'Password did not match credentials'});
                }
            } else {
                callback(400,{'Error':'Could not find the specified user!'});
            }
        })

    } else {
        callback(400,{'Error':'Missing Required Fields!'});
    }
}


handlers._tokens.get = function (data, callback) {
    var id = typeof (data.query.id) === 'string' &&
        data.query.id.trim().length > 0
        ? data.query.id.trim().toLowerCase()
        : false;

    if (id) {
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                callback(200, data);
            } else {
                callback(500, { 'Error': 'There was no such user!' });
            }
        })
    } else {
        callback(404, { 'Error': 'Missing Required Field!' });
    }
}


handlers._tokens.put = function (data, callback) {
    var id = typeof(data.payload.id) == "string" && 
        data.payload.id.length == 20
        ? data.payload.id
        : false ;
    
    var extend = typeof(data.payload.extend) == "boolean" && 
        data.payload.extend === true 
        ? true 
        : false;

    if(id && extend){
        _data.read('tokens',id,function(err,tokenData){
            if(!err && data){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000*60*60;

                    _data.update('tokens',id,tokenData,function(err){
                        if(!err){
                            callback(200);
                        } else{
                            callback(500,{'Error':'Could not update token'});
                        }
                    })
                } else {
                    callback(400,{'Error':'Your token has already expired'});
                }
            } else {
                callback(400,{'Error':'Could not find token data'});
            }
        })
    } else {
        callback(400,{'Error':'Missing Required Field'});
    }
}


handlers._tokens.delete = function (data, callback) {
    var id = typeof (data.query.id) === 'string' &&
        data.query.id.length == 20
        ? data.query.id
        : false;

    if (id) {
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the token details' });
                    }
                })
            } else {
                callback(400, { 'Error': 'There was no such user!' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing Required Field!' });
    }
}


handlers.notFound = function (data, callback) {
    callback(404);
}

module.exports = handlers;
