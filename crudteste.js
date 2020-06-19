var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var async = require('async');
const mysql = require('mysql');
const moment = require('moment');
const { Console } = require('console');
precook = false;


// Create connection to database
var config = {
	server: '192.168.10.12',
	authentication: {
		type: 'default',
		options: {
			userName: 'esl', // update me
			password: 'esl' // update me
		}
	},
	options: {
		database: 'esl',
		encrypt: false,
		minVersion: 'TLSv1'
	}
}

////Conexões
// Criar conexão ao banco mysql
var connectionmysql = mysql.createConnection({
	host: '',
	port: 1,
	user: '',
	password: '',
	database: '',
	multipleStatements: true,
});

//Elementos com informações gerais do banco ESL
var objDados = {
	length: 0,
	addElem: function addElem(elem) {
		// obj.length é automaticamente incrementado
		// toda vez que um elemento for adicionado.
		[].push.call(this, elem);
	},
};

//Elementos somente dos preços normais
var objPreco = {
	length: 0,
	addElem: function addElem(elem) {
		// obj.length é automaticamente incrementado
		// toda vez que um elemento for adicionado.
		[].push.call(this, elem);
	}
};

//Elementos somente dos preços promocionais
var objPrecoPromo = {
	length: 0,
	addElem: function addElem(elem) {
		// obj.length é automaticamente incrementado
		// toda vez que um elemento for adicionado.
		[].push.call(this, elem);
	}
};

//Elementos somente dos produtos esgotados
var objEsgotado = {
	length: 0,
	addElem: function addElem(elem) {
		// obj.length é automaticamente incrementado
		// toda vez que um elemento for adicionado.
		[].push.call(this, elem);
	}
};


var connection = new Connection(config);

function Start(callback) {
    console.clear();
	console.log('Starting...');
	callback(null);
}

///leitura no banco da SEAL
function ReadFull(callback) {
	console.log('Reading rows from the Table in database ESL...');
	// Read all rows from table
	request = new Request(
		'select top 10 * from VIEW_PRODUTO order by DATA desc',
		function (err, rowCount, rows) {
			if (err) {
				callback(err);
			} else {
				console.log(rowCount + ' row(s) returned');
				callback(null);
			}
		});
	// Print the rows read
	var result = "";
	request.on('row', function (columns) {
		Codigo = columns[0].value;
		Preco = columns[1].value + "." + columns[2].value;
		Promo = columns[3].value + "." + columns[4].value;
		Datainic = columns[5].value;
		Datafim = columns[6].value;
		Tipo = columns[7].value;
		Descricao = columns[8].value;
		Data_esl = columns[9].value;
		objDados.addElem({
			Codigo,
			Preco,
			Promo,
			Datainic,
			Datafim,
			Tipo,
			Descricao,
			Data_esl
		});
		result = "";
	});
	// Execute SQL statement
	connection.execSql(request);
}

//insert dos dados da SEAL para o MYSQL no site
function UpdateFull(callback) {
	// update array all rows from table
	let sql = "UPDATE nasa_wc_product_meta_lookup SET preconormal= ?, precopromo = ?, dtpromo_inicio= ?, dtpromo_fim = ?, tipo = ?, data_esl = ? where SKU= ?";
	data = JSON.parse(JSON.stringify(objDados));
	var dados = data;
	console.log('Update full information in database wordpress...');
	for (var i = 0; i < dados.length; i++) {
		//console.log(dados[i].Codigo, dados[i].Descricao, dados[i].Preco, dados[i].Promo, dados[i].Datainic, dados[i].Datafim, data[i].Data_esl);
		values = [dados[i].Preco, dados[i].Promo, dados[i].Datainic, dados[i].Datafim, dados[i].Tipo, data[i].Data_esl, dados[i].Codigo];
		//quando chegar no total do length, ira terminar o processo.
		if (i == (dados.length - 1)) {
			callback(null);
		}
		connectionmysql.query(sql, values, function (err, result) {
			if (err);
				//console.log(result.affectedRows + ' row updated');
			}
			);
		};
}

//Leitura dos dados do preço normal
function ReadPrecoNormal(callback) {
	console.log('Reading Full Prices...');
	let sql = "SELECT * FROM `nasa_wc_product_meta_lookup` ORDER BY data_esl LIMIT 200";
	            connectionmysql.query(sql, function (err, result) {
                if (err) throw err;
					Object.keys(result).forEach(function(key) {
						var row = result[key];
						Codigo = row.product_id;
						Sku = row.sku;
						Preconormal = row.preconormal;
						Tipo = row.tipo;
						Data_esl = row.data_esl;
						//adicionar os dados coletados para o objeto preco
						objPreco.addElem({Codigo, Sku, Preconormal, Tipo, Data_esl});
					  });
					  //mostra o objeto em tela
					  //Rows = JSON.parse(JSON.stringify(objPreco));
					  //console.table(Rows);
					  callback(null);
			});
}

function ReadPrecoPromo(callback) {
	let sql = "SELECT * FROM `nasa_wc_product_meta_lookup` where TIPO = 'PROMO' ORDER BY data_esl";
		connectionmysql.query(sql, function (err, result,fields) {
		if (err) throw err;
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				Codigo = row.product_id;
				Sku = row.sku;
				Preconormal = row.preconormal;
				Precopromo = row.precopromo;
				Tipo = row.tipo;
				Data_esl = row.data_esl;
				Data_from = moment().unix(row.preconormal);
				Data_to = moment().unix(row.preconormal);
				//adicionar os dados coletados para o objeto preco
				objPrecoPromo.addElem({Codigo, Sku, Preconormal, Precopromo, Data_from, Data_to, Tipo, Data_esl});
			  });
			  //mostra o objeto em tela
			  //Rows = JSON.parse(JSON.stringify(objPrecoPromo));
			  //console.table(Rows);
			  callback(null);
	});
	console.log('Reading Product Price Promo...');
}
function ReadEsgotado(callback) {
	let sql = "SELECT * FROM `nasa_wc_product_meta_lookup` where TIPO = 'ESGOTADO' ORDER BY data_esl";
	connectionmysql.query(sql, function (err, result,fields) {
		if (err) throw err;
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				Codigo = row.product_id;
				Sku = row.sku;
				Tipo = row.tipo;
				Data_esl = row.data_esl;
				//adicionar os dados coletados para o objeto preco
				objEsgotado.addElem({Codigo, Sku, Tipo, Data_esl});
			  });
			  //mostra o objeto em tela
			  //Rows = JSON.parse(JSON.stringify(objPrecoPromo));
			  //console.table(Rows);
			  callback(null);
	});
	console.log('Reading Product Soldout...');
}
//inserto dos dados de preço da tabela nasa_wc_product_meta_lookup para a nasa_postmeta
function UpdatePrice(callback) {
	console.log('Update Price...');
	let sql = "UPDATE nasa_postmeta SET meta_value= ? where post_id= ? and meta_key = '_price'";
	data = JSON.parse(JSON.stringify(objPreco));
	var dados = data;
	for (var i = 0; i < dados.length; i++) {
		//console.log("Codigo Site: " + dados[i].Codigo + " Codigo Interno:"+ dados[i].Sku + " Price Regular: " + dados[i].Preconormal);
		values = [dados[i].Preconormal, dados[i].Codigo];
		if (i == (dados.length - 1)) {
			callback(null);
		}
		connectionmysql.query(sql, values, function (err, result) {
			if (err);
				//console.log(result.affectedRows + ' row updated');
			});
	};
}
///falta testar
function UpdatePricePromo(callback) {
	console.log('Update Price Promo...');
	let sql = "UPDATE nasa_postmeta SET meta_value= ? where post_id= ? and meta_key = '_price'";
	data = JSON.parse(JSON.stringify(objPrecoPromo));
	var dados = data;
	for (var i = 0; i < dados.length; i++) {
		//console.log("Codigo Site: " + dados[i].Codigo + " Codigo Interno:"+ dados[i].Sku + " Price Regular: " + dados[i].Preconormal);
		values = [dados[i].Preconormal, dados[i].Codigo];
		if (i == (dados.length - 1)) {
			callback(null);
		}
		connectionmysql.query(sql, values, function (err, result) {
			if (err);
				//console.log(result.affectedRows + ' row updated');
			});
	};
}
//inserto dos dados de preço regular da tabela nasa_wc_product_meta_lookup para a nasa_postmeta
function UpdateRegular(callback) {
	console.log('Update Price Regular...');
	let sql = "UPDATE nasa_postmeta SET meta_value= ? where post_id= ? and meta_key = '_regular_price'";
	data = JSON.parse(JSON.stringify(objPreco));
	var dados = data;
	for (var i = 0; i < dados.length; i++) {
		//console.log("Codigo Site: " + dados[i].Codigo + " Codigo Interno:"+ dados[i].Sku + " Price Regular: " + dados[i].Preconormal);
		values = [dados[i].Preconormal, dados[i].Codigo];
		//quando chegar no total do length, ira terminar o processo.
		if (i == (dados.length - 1)) {
			callback(null);
		}
		connectionmysql.query(sql, values, function (err, result) {
			if (err);
				//console.log(result.affectedRows + ' row updated');
			});
	};
}
////deleta todos os dados de promoção (preçopromo, datainicio e datafim)
function CleanSale(callback) {
	console.log("Clean info for Sale")
	let sqldel = "DELETE FROM nasa_postmeta WHERE meta_key = '_sale_price' or meta_key ='_sale_price_dates_from' or meta_key ='_sale_price_dates_to'"
	connectionmysql.query(sqldel, (error, results, fields) => {
		if (error)
		  console.log(error);
		console.log('Deleted Row(s):', results.affectedRows);
	  });
	  callback(null);
}
////inserto dos dados de preço promocional da tabela nasa_wc_product_meta_lookup para a nasa_postmeta
//falta finalizar
function UpdateSale(callback) {
	console.log('Update Price Sale...');
	let sql = "INSERT INTO nasa_postmeta (post_id, meta_key, meta_value) VALUES (?, '_sale_price', ?),(?, '_sale_price_dates_from', ?),(?, '_sale_price_dates_to', ?);";
	data = JSON.parse(JSON.stringify(objPrecoPromo));
	var dados = data;
	for (var i = 0; i < dados.length; i++) {
		//console.log("Codigo Site: " + dados[i].Codigo + " Codigo Interno:"+ dados[i].Sku + " Price Regular: " + dados[i].Preconormal);
		values = [dados[i].Codigo, dados[i].Precopromo, dados[i].Codigo, dados[i].Data_from, dados[i].Codigo, dados[i].Data_to];
		//values = [dados[i].Codigo, dados[i].Precopromo];
		//quando chegar no total do length, ira terminar o processo.
		if (i == (dados.length - 1)) {
			callback(null);
		}
		connectionmysql.query(sql,values, (error, results, fields) => {
			if (error)
			console.log(error);
			//console.log('Update Row(s):', results);
		  });
		}
}

//faz a validação se o produto não tem estoque, de acordo com o bando da Seal
function ValidarOutofstock(callback) {
	console.log('Update Product outofstock...');
	let sql = "UPDATE nasa_postmeta SET meta_value= 'outofstock' where post_id= ? and meta_key = '_stock_status'";
	data = JSON.parse(JSON.stringify(objEsgotado));
	var dados = data;
	//for (var i = 0; i < dados.length; i++) {
		//console.log("Codigo Site: " + dados[i].Codigo + " Codigo Interno:"+ dados[i].Sku + " Price Regular: " + dados[i].Preconormal);
	//	values = [dados[i].Codigo];
	//	if (i == (dados.length - 1)) {
	//	}
	//};
	var studentsId = [];
	for (var i = 0; i < dados.length; i++) {
        studentsId.push(dados[i].Codigo);
    }
    console.log(studentsId);
	connectionmysql.query(sql, studentsId.join(), function (err, result) {
	if (err) throw err;
	console.log(result.affectedRows + ' row updated');
});
}
//faz a validação se o produto tem estoque, de acordo com o bando da Seal
function ValidaInstock(callback) {
	console.log('Update Product instock...');
	let sql = "UPDATE nasa_postmeta SET meta_value= 'instock' where post_id= ? and meta_key = '_stock_status'";
	data = JSON.parse(JSON.stringify(objPreco));
	var dados = data;
	for (var i = 0; i < dados.length; i++) {
		//console.log("Codigo Site: " + dados[i].Codigo + " Codigo Interno:"+ dados[i].Sku + " Price Regular: " + dados[i].Preconormal);
		values = [dados[i].Codigo];
		if (i == (dados.length - 1)) {
			callback(null);
		}
		connectionmysql.query(sql, values, function (err, result) {
			if (err);
				//console.log(result.affectedRows + ' row updated');
			});
		};
}
//contador de totais de price, promo, produtos, c/ ou s/ estoque
function Totais(callback){		
	let sqlprice = "select count(*) as totalprice  from  nasa_postmeta where meta_key = '_price'";
	let sqlregular = "select count(*) as totalregular from nasa_postmeta where meta_key = '_regular_price'";
	let sqlpromo = "select count(*) as totalpromo from nasa_postmeta where meta_key = '_sale_price'";
	let sqlproduct ="select count(*) as totalproduct from nasa_wc_product_meta_lookup where data_esl is not null";
	let sqlcinstock =  "select count(*) as total from nasa_postmeta where meta_value = 'instock' and meta_key = '_stock_status'"
	let sqloutofstock = "select count(*) as total from nasa_postmeta where meta_value = 'outofstock' and meta_key = '_stock_status'";
	console.log("--------------- Load ---------------")
	connectionmysql.query(sqlprice, function (err, result) {
		if (err);
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				total = row.totalprice;
				console.log("--------------- Resultado ---------------")
				console.log("Produtos com preço em Price: "+total);
			  });
	});
	connectionmysql.query(sqlregular, function (err, result) {
		if (err);
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				total = row.totalregular;
				console.log("Produtos com preço em Price Regular: "+total);
			  });
	});
	connectionmysql.query(sqlpromo, function (err, result) {
		if (err);
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				total1 = row.totalpromo;
				console.log("Produtos com preço em Price Promo: "+total1);
			  });
	});
	connectionmysql.query(sqloutofstock, function (err, result) {
		if (err);
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				Total = row.total;
				console.log("Product outofstock : "+Total);
			  });
	});
	connectionmysql.query(sqlcinstock, function (err, result) {
		if (err);
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				Total = row.total;
				console.log("Product instock: "+Total);
			  });
	});
	connectionmysql.query(sqlproduct, function (err, result) {
		if (err);
			Object.keys(result).forEach(function(key) {
				var row = result[key];
				total1 = row.totalproduct;
				console.log("Produtos com informações da ESL atualizados: "+total1);
			  });
		callback(null);
	});
} 
//mostrar resultado geral dos dados coletados
function Resultado(callback){
	console.log("----------------------------------------")
	console.log("--------------------- Resultado dos objetos ---------------------")
	console.log("--------------------- Dados do ESL ---------------------")
	console.table(objDados);
	console.log("--------------------- Dados de Preço ---------------------")
	console.table(objPreco);
	console.log("--------------------- Dados de Preço Promoção ---------------------")
	console.table(objPrecoPromo);
	console.log("--------------------- Dados de Produto Esgotado ---------------------")
	console.table(objEsgotado);
	callback(null);
}
//Forçar a finlaização do processo.
function Exit(callback) {
	//finalizar conexões
	console.log("Close connection MYSQL")
	connectionmysql.end();
	console.log("Close connection SQL")
	connection.close();
	setTimeout(() => {
		console.log('Finished');
		process.exit();
	}, 5000);
}

function Complete(err) {
	if (err) {
	//	callback(err);
	} else {
		console.log("Done!");
		process.exit();
	}
}
//salvar log, falta finalizar
function Salvarlog(){
	var fs = require('fs');
	Rows = JSON.parse(JSON.stringify(objEsgotado));
	fs.writeFile("logs\\meuarquivo.txt", "COD " + Rows, function(erro) {
		if(erro) {
			throw erro;
		}
		console.log("Log salvo");
		callback(null);
	}); 
}
function Conetarmysql(callback) {
    connectionmysql.connect(function(error) {
        if (error);
        console.log('Conectou no MYSQL!');
        callback(null);
    });
}

// Attempt to connect and execute queries if connection goes through
connection.on('connect', function (err) {
	if (err) {
		console.log(err);
	} else {
		console.log('Connected');
		// Execute all functions in the array serially
		async.waterfall([
			Conetarmysql,
			Start,
			ReadFull,
			UpdateFull,
			//ReadPrecoNormal,
			//ReadPrecoPromo,
			ReadEsgotado,
			//UpdatePrice,
			//UpdatePricePromo,
			//UpdateRegular,
			//CleanSale,
			//UpdateSale,
			ValidarOutofstock,
			//ValidaInstock,
			Totais,
			/////////Resultado
			/////////Salvarlog,
		], Complete)
	}
});
