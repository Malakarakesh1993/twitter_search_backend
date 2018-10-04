## Tweets Finder

A back-end project built on Node.js and Express.

## Requirements

You will need Node.js and MongoDb installed on your environment.

```
	git clone
	cd twitter_search_backend
	npm install
```

Open Mongo Shell with `mongo` command on the termnial.

After Mongo Shell is initiailized, enter the following command. 

If you already have database named twitter_search created previously, remove it:

```
	use twitter_search
	db.dropDatabase()
```

Then, run the following script:

```
	mongo localhost:27017/twitter_search user_create_script.js
```

 After running the script successfully, database `twitter_search` with collection `users` will be created.
 
 Login credentials are `username: admin` and `password: admin`.
 
 Exit the shell and start the application.

```
    npm start
```

The server should now be running and listening for requests on localhost:4444
