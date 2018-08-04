var myID;
var accounts = [];
var config = require('./config.json');
var Masto = require('mastodon')
 
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
                if(!accounts[data.account.id])
                {
                    config.user_blacklist.forEach(function(item){
                        if(item.toLowerCase() == data.account.acct.toLowerCase())
                        {
                            console.log("[ERROR]\tWill not follow " + data.account.acct + ":" + data.account.id + " due to blacklist restrictions on the user.");
                            return;
                        }
                    });
                    config.instance_blacklist.forEach(function(item){
                            var remote_instance = data.account.acct.split('@')[1];
                            if(remote_instance && remote_instance.toLowerCase() == item.toLowerCase())
                            {
                                console.log("[ERROR]\tWill not follow " + data.account.acct + ":" + data.account.id + " due to blacklist restrictions on the instance.");
                                return;
                            }
                    });

                    M.post('accounts/' + data.account.id + '/follow',{
                        reblogs:true
                    }).then(resp => {
                        console.log("[FOLLOW]\t" + data.account.acct + ":" + data.account.id);
                    }).catch(err => {
                        console.log("[ERROR]\t" + err.message);
                    });

                }
                accounts[data.account.id] = true;
            });
        }
    );
},1000);