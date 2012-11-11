var connect = require( "connect" );

module.exports = function( port, base ) {
  port = port || 1337;
  base = base || process.cwd();

  var middleware = [
    connect.static( base ),
    connect.directory( base )
  ];

  connect.logger.format( "thimble", ("[D] server :method :url :status " +
      ":res[content-length] - :response-time ms" ));
  middleware.unshift( connect.logger( "thimble" ) );

  console.log( "starting web server on port " + port );
  connect.apply( null, middleware ).listen( port );
};
