const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

var lib = {};

lib.baseDir = path.join(__dirname,'/../.data/'); // getting base directory 

// callback hell in node is so prevalent in here! :/
// More reasons to use Express 

//CREATE
lib.create = function (dir,filename,data,callback) {

    fs.open(lib.baseDir + dir+'/'+filename+'.json','wx', function (err, fd) {
        if( !err && fd ){

            var stringData = JSON.stringify(data);

            fs.writeFile(fd, stringData, function (err){
                if(!err){
                    fs.close(fd, function(err){
                        if(!err){
                            callback(false);
                        } else {
                            callback('Trouble closing file!');
                        }
                    })
                } else {
                    callback('Had trouble writing!');
                }
            })
        } else {
            callback('Couldn\'t create newfile! may already exist!');
        }
    })
}

// READ
lib.read = function (dirname, filename, callback ){
    fs.readFile(lib.baseDir+dirname+'/'+filename+'.json','utf-8',function (err, data){
        if(!err && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else{ 
            callback(err,data);
        }
    })
}

// UPDATE
lib.update = function (dirname, filename, data, callback){
    fs.open(lib.baseDir+dirname+'/'+filename+'.json','r+', function(err, fd){
        if( !err && fd ){
            var stringData = JSON.stringify(data);

            fs.truncate(fd, function(err){
                if(!err){
                    fs.writeFile(fd, stringData, function(err){
                        if(!err){
                            fs.close(fd, function(err){
                                if(!err){
                                    callback(false);
                                }
                                else{
                                    callback('error in closing file!');
                                }
                            })
                        } else {
                            callback('error in writing to file!');
                        }
                    })
                }
                else{
                    callback('error in truncating!');
                }
            })
        } else {
            callback('error in opening file!');
        }
    })
}

//DELETE
lib.delete = function (dirname, filename, callback){
    fs.unlink(lib.baseDir+dirname+'/'+filename+'.json', function(err){
        if(!err){
            callback(false);
        } else {
            callback('error deleting the file!');
        }
    })
}

module.exports = lib;