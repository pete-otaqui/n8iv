!function() {
	function Class( path, desc ) {
		if ( !desc && n8iv.isObj( path ) ) {
			desc = path; path = '';
		}

		var C, name, ns, _ctor,
			_proto    = n8iv.obj(),
			_super    = desc.extend || Object,
			mod       = desc.module,
			mixin     = desc.mixin  || dumb,
			singleton = desc.singleton,
			type      = getType( desc.type || path );

		!n8iv.isStr( _super ) || ( _super = reg_path[_super] || reg_type[_super] );

		_ctor = desc.constructor !== Object ? desc.constructor : _super;

		if ( path ) {
			ns   = path.split( '.' );
			name = ns.pop();
			ns   = n8iv.bless( ns, mod );
		}

		n8iv.def( _proto, 'parent',      n8iv.describe( n8iv.noop, 'cw' ), T );

		n8iv.def( _proto, 'constructor', n8iv.describe( ctor( _ctor, _super, name, _proto ), 'w' ), T );

		C = _proto.constructor;

		n8iv.def(  C,     '__type__',    n8iv.describe( 'class', 'w' ), T );
		n8iv.def( _proto, '__type__',    n8iv.describe(  type,   'w' ), T );

		Object.remove( desc, defaults );

		C.prototype = apply( _proto, n8iv.copy( desc, mixin ) );
		n8iv.def( C, 'create',    n8iv.describe( create( extend( C, _super ) ), 'w' ), T );

		path = path.replace( re_root, '' );

		if ( singleton ) {
			n8iv.def( C, 'singleton', n8iv.describe( { value : ( singleton === T ? new C : C.create.apply( C, [].concat( singleton ) ) ) }, 'w' ) );
			register( C, path, type );
			C = C.singleton;
		}
		else if ( path ) register( C, path, type );

		!( name && ns ) || n8iv.def( ns, name, n8iv.describe( { value : C }, 'w' ) );

		return C;
	}

	function apply( proto, desc ) {
		Object.each( desc, function( v, k ) {
			switch( n8iv.type( v ) ) {
				case 'object' : n8iv.def( proto, k, v, T ); break;
				default       : proto[k] = v;
			}
		} );
		return proto;
	}

	function create( C ) { return function create() { return singleton( C ) || C.apply( Object.create( C.prototype ), arguments ); }; }

	function ctor( m, s, name, P ) {
		var C    = wrap( m, s, name ),
			Ctor = function() {
				var ctx = this === U ? N : this, ctor = ctx ? ctx.constructor : N;
				return singleton( ctor ) || C.apply( ( is( ctx, Ctor ) ) ? ctx : Object.create( P ), arguments );
			};
		return Ctor.mimic( m, name );
	}

	function extend( C, Sup ) {
		if ( !( '__super' in C.prototype ) ) {
			var p = C.prototype, sp = Sup.prototype;

			Object.keys( sp ).forEach( function( k ) {
				if ( k in reserved ) return;
				switch ( n8iv.type( sp[k] ) ) {
					case 'function' : ( p[k] = !n8iv.isFn( p[k] ) ? wrap( sp[k], n8iv.noop, k ) : wrap( p[k], sp[k], k ) ); break;
					default         : k in p || n8iv.def( p, k, n8iv.description( sp, k ), T );
				}
			} );

			Object.keys( p ).forEach( function( k ) { // this allows the calling of "this.parent();" on a Class with no __super without throwing any errors
				!( n8iv.isFn( p[k] ) && ( !( k in sp ) || p[k].valueOf() !== sp[k].valueOf() ) ) || ( p[k] = wrap( p[k], n8iv.noop, k ) );
			} );

			sp = n8iv.describe( { value : Object.create( Sup.prototype ) }, 'w' );
			n8iv.def( C,           '__super', sp );
			n8iv.def( C.prototype, '__super', sp );
		}
		return C;
	}

	function getType( type ) { return type.replace( re_root, '' ).replace( re_dot, '_' ).toLowerCase(); }

	function is( o, C ) {
		if ( o && C ) {
			if ( o instanceof C ) return T;
			if ( !( o = o.constructor ) ) return F;
			do { if ( o === C ) return T; }
			while ( o.__super && ( o = o.__super.constructor ) );
		}
		return F;
	}

	function register( C, path, type ) {
		var err_msg = path + ERR_MSG, msg = [];
		!path || !( path in reg_path ) || msg.push( err_msg + 'Class' );
		!type || !( type in reg_type ) || msg.push( err_msg + 'Type'  );
		if ( msg.length ) {
			n8iv.trace(); msg.forEach( n8iv.error ); n8iv.error( new Error( 'n8iv.Class overwrite error.' ), T );
		}
		reg_path[path] = reg_type[type] = C;
	}

	function singleton( C ) { return !C ? N : C.singleton || N; }

	function type( c ) {
		var ctor = c.constructor, k;
		for ( k in reg_path ) if ( reg_path[k] === ctor ) return k;
		return N;
	}

	function wrap( m, s, name ) {
		return function() {
			var o, p = n8iv.description( this, 'parent' ) || desc_noop;
			p.writable = T;
			n8iv.def( this, 'parent', ( s ? n8iv.describe( s, 'cw' ) : desc_noop ), T );
			o = m.apply( this, arguments );
			n8iv.def( this, 'parent', p, T );
			return this.chain !== F && o === U ? this : o;
		}.mimic( m, name );
	}

	var ERR_MSG   = ' already exists. Cannot override existing ',
		defaults  = ( 'constructor extend mixin module singleton type' ).split( ' ' ),
		desc_noop = n8iv.describe( n8iv.noop, 'cw' ),
		dumb      = n8iv.obj(), re_dot   = /\./g,      re_root  = /^\u005E/,
		reg_path  = n8iv.obj(), reg_type = n8iv.obj(), reserved = n8iv.obj(); // <- Object.create( null ); resolves issue in safari with using {}

	reserved.constructor = reserved.parent = reserved.__super = reserved.__type__ = T;

	n8iv.def( Class, 'is',     n8iv.describe( is,    'w' ) )
		.def( Class, 'type',   n8iv.describe( type,  'w' ) )
		.def( n8iv,  'Class',  n8iv.describe( Class, 'w' ) )
		.def( n8iv,  'create', n8iv.describe( function( n ) {
			var C = reg_type[n] || reg_type['n8iv_' + n] || reg_path[n], args = Array.from( arguments, 1 );

			C || ( n8iv.trace().error( new Error( n + ' does not match any registered n8iv.Classes.' ), T ) );

			return C.create.apply( n8iv.global, args );
		}, 'w' ) );
}();
