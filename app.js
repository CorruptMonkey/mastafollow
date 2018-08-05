var myID;
var accounts = [];
var config = require('./config.json');
const Masto = require('mastodon')
const mysql = require('mysql');
let db;
if(config.mysql.use)
{
    db = mysql.createConnection({
        host                : config.mysql.host,
        user                : config.mysql.user,
        password            : config.mysql.pass,
        database            : config.mysql.db
    });
    
    db.connect();
    db.query('SELECT uid,username FROM network', function(err, res, fields){
        if(err) { return; }
        res.forEach(function(item){
            console.log("[INIT]\t" + item.username + ":" + item.uid);
            accounts[item.uid] = true;
        });
        console.log("Initiated " + res.length + " users.");
    });
}

var M = new Masto({
  access_token: config.access_token,
  timeout_ms: 60000,
  api_url: config.instance_url + '/api/v1/'
});

setInterval(function(){
    M.get(
        'timelines/public',
        {
            
        }
    ).then(
        resp => {
            resp.data.forEach(function(data){
                var dnf = false;
                if(!accounts[data.account.id])
                {
                    if( data.account.note.toLowerCase().indexOf('#nobot') > 0 )
                    {
                        console.log("[ERROR]\tWill not follow " + data.account.acct + ":" + data.account.id + " due to #nobot tag.");
                        dnf = true;
                        if(config.mysql.use)
                        {
                            db.query("INSERT INTO network (uid,username,follow_sent,follow_restrict) VALUES(?,?,0,1)", [data.account.id,data.account.acct],function(err, res, fields){
                                if(err) { return; }
                            });
                        }
                    }
                    config.user_blacklist.forEach(function(item){
                        if(item.toLowerCase() == data.account.acct.toLowerCase())
                        {
                            console.log("[ERROR]\tWill not follow " + data.account.acct + ":" + data.account.id + " due to blacklist restrictions on the user.");
                            dnf = true;
                            if(config.mysql.use)
                            {
                                db.query("INSERT INTO network (uid,username,follow_sent,follow_restrict) VALUES(?,?,0,1)", [data.account.id,data.account.acct],function(err, res, fields){
                                    if(err) { return; }
                                });
                            }
                        }
                    });
                    config.instance_blacklist.forEach(function(item){
                            var remote_instance = data.account.acct.split('@')[1];
                            if(remote_instance && remote_instance.toLowerCase() == item.toLowerCase())
                            {
                                console.log("[ERROR]\tWill not follow " + data.account.acct + ":" + data.account.id + " due to blacklist restrictions on the instance.");
                                dnf = true;
                                if(config.mysql.use)
                                {
                                    db.query("INSERT INTO network (uid,username,follow_sent,follow_restrict) VALUES(?,?,0,1)", [data.account.id,data.account.acct],function(err, res, fields){
                                        if(err) { return; }
                                    });
                                }
                            }
                    });
                    if(dnf == false)
                    {
                        if(config.mysql.use)
                        {
                            db.query("INSERT INTO network (uid,username,follow_sent,follow_restrict) VALUES(?,?,1,0)", [data.account.id,data.account.acct],function(err, res, fields){
                                if(err) { return; }
                            });
                        }
                        M.post('accounts/' + data.account.id + '/follow',{
                            reblogs:true
                        }).then(resp => {
                            console.log("[FOLLOW]\t" + data.account.acct + ":" + data.account.id);
                        }).catch(err => {
                            console.log("[ERROR]\t" + err.message);
                        });
                    }
                }
                accounts[data.account.id] = true;
            });
        }
    );
},config.checkInterval);