const controller = {};

controller.login = (req, res) => {
	console.log(req.body);
	
	req.getConnection(function(err, connection) {
		if(err) res.json(err);
		connection.query('SELECT * FROM user',[] , function(err,results)
		{
			if(err) res.json(err);
			
			var ok = -1;
			var user = {};
			results.map((r) => {
				if(r.username == req.body.username && r.password == req.body.password)
				{
					ok = 1;
					user.id = r.id;
					user.name = r.username;
					user.score = r.score;
				}

			});
			if(ok == 1)
			{
				res.json({
					success: 1,
					data: user
				});
			}
			else
			{
				res.json({
					success: -1
				});
			}
		});

	});

	
};

module.exports = controller;
