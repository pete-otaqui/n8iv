
	n8iv.ENV != 'commonjs' || module.exports === n8iv || ( module.exports = n8iv );

//}( this, typeof n8iv == 'undefined' ? this.document ? this.n8iv : require( './n8iv._' ) : n8iv  );
}( typeof n8iv != 'undefined' ? n8iv : typeof require != 'undefined' ? require( './n8iv._' ) : N );
