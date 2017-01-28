Date.prototype.display = function() {
    return this.getFullYear() + "/" + (this.getMonth() + 1) + "/" + this.getDate()
        + " " + this.getHours() + ":" + this.getMinutes();
};
(function() {
    window.demo = {
        pages:{},
        db: {
            _instance: null,
            init: function (callback) {
                if (this._instance == null) {
                    var db = new DemoDbContext();
                    try {
                        db.init(function () {
                            demo.db._instance = db;
                            callback && callback();
                        });
                    } catch (ex) {
                        alert(ex);
                    }
                } else {
                    callback();
                }
            },
            getInstance: function () {
                return this._instance;
            }
        }
    };
})();


/* if you want to re-create the DB(due to schema changes, re-init sample data, etc.),
change the version parameter on line:
    nova.data.DbContext.call(...);
*/
DemoDbContext = function () {
    nova.data.DbContext.call(this, "recibos01", 1, "recibos01", 1000001);
   // nova.data.DbContext.call(this, "DB Prueba", 0.1, "Database Prueba", 1);

    this.logSqls = true;
    this.alertErrors = true;
    this.users = new nova.data.Repository(this, User, "users");
    this.clientes = new nova.data.Repository(this, Cliente, "clientes");
    this.recibos = new nova.data.Repository(this, Recibo, "recibos");
    this.conceptos = new nova.data.Repository(this, Concepto, "conceptos");
    this.recibosconceptos = new nova.data.Repository(this, RecibosConceptos, "recibosconceptos");

};

DemoDbContext.prototype = new nova.data.DbContext();
DemoDbContext.constructor = DemoDbContext;

DemoDbContext.prototype.initData = function(callback) {
    nova.data.DbContext.prototype.initData.call(this, callback);
    // override this method to intialize custom data on database creation
};

DemoDbContext.prototype.getMigrations = function() {
    var obj = this;
    return [];
    return [
        {
            version: 2,
            migrate:function(callback) {
                var sql = "alter table ..., or update existing data, any updates to schema or data on upgrading";
                obj.executeSql(sql, callback);
            }
        }
    ];
};

var User = function () {
    nova.data.Entity.call(this);
    this.username = "";
    this.birthYear = 0;
    this.isDisabled = false;
    this.createdTime = new Date();
    this.lastUpdatedTime = new Date();
};


User.prototype = new nova.data.Entity();
User.constructor = User;

User.prototype.updateFrom = function(user) {
    this.username = user.username;
    this.birthYear = user.birthYear;
    this.isDisabled = user.isDisabled;
    this.lastUpdatedTime = new Date();
};

var UserService = function() {

};


UserService.prototype = {
    getAll: function (callback) {
        demo.db.getInstance().users.toArray(callback);
    },
    add:function(user, callback) {
        var db = demo.db.getInstance();
        user.lastUpdatedTime = null;
        db.users.add(user);
        db.saveChanges(callback);
    },
    deleteUser:function(id, callback) {
        var db = demo.db.getInstance();
        db.users.removeByWhere("id=" + id, callback);
    },
    update:function(user, callback) {
        var db = demo.db.getInstance();
        db.users.where("id=" + user.id).firstOrDefault(function(dbUser) {
            dbUser.updateFrom(user);
            db.users.update(dbUser);
            db.saveChanges(function() {
                user.lastUpdatedTime = dbUser.lastUpdatedTime;
                callback && callback();
            });
        });
    },
    get:function(id, callback) {
        demo.db.getInstance().users.firstOrDefault(callback, "id=" + id);
    }
};

(function() {
    demo.pages.Index = function() {

    };

    demo.pages.Index.prototype = {
        onLoaded: function() {
            var obj = this;
            $("#btnAdd").click(function() {
                obj.add();
            });
            $("#btnUpdate").click(function() {
                obj.update();
            });
            $("#btnCancel").click(function() {
                obj.reset();
            });
            $(".btn-delete").live("click", function() {
                obj.deleteUser(this);
            });
            $(".btn-edit").live("click", function() {
                obj.edit(this);
            });

            var thisYear = new Date().getFullYear();
            var yearsHtml = "";
            for (var i = thisYear; i > thisYear - 100; i--) {
                yearsHtml += '<option value="' + i + '">' + i + '</option>';
            }

            var busca_clientes = new

            $("#ddlYears").html(yearsHtml);
            this.loadUsers();
        },


        loadUsers: function() {
            var obj = this;
            var service = new UserService();
            service.getAll(function(users) {
                var html = "";
                for (var i = 0; i < users.length; i++) {
                    html += '<option value="' + i + '">' + i + '</option>';
                }
                $("#users").html(html);
            });
        },
        parseUser: function() {
            var user = new User();
            user.id = $("#hfId").val() * 1;
            user.username = $("#txtUsername").val();
            user.birthYear = $("#ddlYears").val() * 1;
            user.isDisabled = $("#ddlDisabled").val() == "true";
            return user;
        },
        bindForm: function (user) {
            $("#hfId").val(user.id);
            $("#nombres").val(user.username);
            $("#ddlYears").val(user.birthYear);
            $("#ddlDisabled").val(user.isDisabled);
        },
        createRowHtml: function(user) {
            var html = '<tr data-id=' + user.id + '>\
                            <td>' + user.username + '</td>\
                            <td>' + user.birthYear + '</td>\
                            <td>' + (user.isDisabled ? 'yes' : 'no') + '</td>\
                            <td>' + user.createdTime.display() + '</td>\
                            <td>' + (user.lastUpdatedTime ? user.lastUpdatedTime.display() : '-') + '</td>\
                            <td>\
                                <input type="button" value="edit" class="btn-edit"/>\
                                <input type="button" value="delete" class="btn-delete"/>\
                            </td>\
                        </tr>';
            return html;
        },
        add: function() {
            var obj = this;
            var user = this.parseUser();
            var service = new UserService();
            service.add(user, function() {
                $("#users").append(obj.createRowHtml(user));
                obj.reset();
            });
        },
        update: function() {
            var obj = this;
            var service = new UserService();
            var user = this.parseUser();
            service.update(user, function() {
                var $tr = $('tr[data-id="' + user.id + '"]');
                $tr.replaceWith(obj.createRowHtml(user));
                obj.reset();
                $("#formEdit")[0].reset();
            });
        },
        reset: function() {
            $("#txtUsername").val("");
            $("#btnAdd").show();
            $("#btnUpdate, #btnCancel").hide();
        },
        edit: function(sender) {
            var id = $(sender).closest("tr").attr("data-id");
            var obj = this;
            var service = new UserService();
            service.get(id, function(user) {
                obj.bindForm(user);
                $("#btnAdd").hide();
                $("#btnUpdate, #btnCancel").show();
            });
        },
        deleteUser: function(sender) {
            if (!confirm("Are you sure you want to delete this user?")) {
                return;
            }
            var id = $(sender).closest("tr").attr("data-id");
            var service = new UserService();
            service.deleteUser(id, function() {
                $(sender).closest("tr").remove();
            });
        }
    };
})();







////////////////************ CLIENTES *************/////////////////////

var Cliente = function () {
    nova.data.Entity.call(this);
    this.nombres = "";
    this.apellidos = "";
    this.dni = "";
    this.empresa = "";
    this.direcion = "";
};

Cliente.prototype = new nova.data.Entity();
Cliente.constructor = Cliente;

Cliente.prototype.updateFrom = function(cliente) {
    this.nombres = cliente.nombres;
    this.apellidos = cliente.apellidos;
    this.dni = cliente.dni;
    this.empresa = cliente.empresa;
    this.direcion = cliente.direcion;
};

var ClienteService = function() {

};

ClienteService.prototype = {
    getAll: function (callback) {
        demo.db.getInstance().clientes.toArray(callback);
    },
    add:function(cliente, callback) {
        var db = demo.db.getInstance();
        //cliente.lastUpdatedTime = null;
        db.clientes.add(cliente);
        db.saveChanges(callback);
    },
    deleteCliente:function(id, callback) {
        var db = demo.db.getInstance();
        db.clientes.removeByWhere("id=" + id, callback);
    },
    update:function(cliente, callback) {
        var db = demo.db.getInstance();
        db.clientes.where("id=" + cliente.id).firstOrDefault(function(dbCliente) {
            dbCliente.updateFrom(cliente);
            db.clientes.update(dbCliente);
            db.saveChanges(function() {
                //cliente.lastUpdatedTime = dbCliente.lastUpdatedTime;
                callback && callback();
            });
        });
    },
    get:function(id, callback) {
        demo.db.getInstance().clientes.firstOrDefault(callback, "id=" + id);
    }
};

(function() {
    demo.pages.Clientes = function() {

    };

    demo.pages.Clientes.prototype = {
        onLoaded: function() {
            var obj = this;
            $("#btnAdd").click(function() {
                obj.add();
            });
            $("#btnUpdate").click(function() {
                obj.update();
            });
            $("#btnCancel").click(function() {
                obj.reset();
            });
            $(".btn-delete").live("click", function() {
                obj.deleteCliente(this);
            });
            $(".btn-edit").live("click", function() {
                obj.edit(this);
            });

            var thisYear = new Date().getFullYear();
            var yearsHtml = "";
            for (var i = thisYear; i > thisYear - 100; i--) {
                yearsHtml += '<option value="' + i + '">' + i + '</option>';
            }

                $("#ddlYears").html(yearsHtml);
            this.loadClientes();
        },


        loadClientes: function() {
            var obj = this;
            var service = new ClienteService();
            service.getAll(function(clientes) {
                var html = "";
                for (var i = 0; i < clientes.length; i++) {
                 html += obj.createRowHtml(clientes[i]);
                 }
                $("#clientes").html(html);
            });
        },
        parseCliente: function() {
            var cliente = new Cliente();
            cliente.id = $("#hfId").val() * 1;
            cliente.nombres = $("#nombres").val();
            cliente.apellidos = $("#apellidos").val();
            cliente.dni = $("#dni").val();
            cliente.empresa = $("#empresa").val();
            cliente.direcion = $("#direcion").val();
            return cliente;
        },
        bindForm: function (cliente) {
            $("#hfId").val(cliente.id);
            $("#nombres").val(cliente.nombres);
            $("#apellidos").val(cliente.apellidos);
            $("#dni").val(cliente.dni);
            $("#empresa").val(cliente.empresa);
            $("#direcion").val(cliente.direcion);

        },
        createRowHtml: function(cliente) {
            var html = '<tr data-id=' + cliente.id + '>\
                            <td>' + cliente.dni + '</td>\
                            <td>' + cliente.nombres + '</td>\
                            <td>' + cliente.apellidos + '</td>\
                            <td>' + cliente.direcion + '</td>\
                            <td>' + cliente.empresa + '</td>\
                            <td>\
                                <input type="button" value="edit" class="btn-edit"/>\
                                <input type="button" value="delete" class="btn-delete"/>\
                            </td>\
                        </tr>';
            return html;
        },

        add: function() {
            var obj = this;
            var cliente = this.parseCliente();
            var service = new ClienteService();
            service.add(cliente, function() {
                $("#clientes").append(obj.createRowHtml(cliente));
                obj.reset();
            });
        },
        update: function() {
            var obj = this;
            var service = new ClienteService();
            var cliente = this.parseCliente();
            service.update(cliente, function() {
                var $tr = $('tr[data-id="' + cliente.id + '"]');
                $tr.replaceWith(obj.createRowHtml(cliente));
                obj.reset();
                $("#formEdit")[0].reset();
            });
        },
        reset: function() {
            $("#nombres").val("");
            $("#apellidos").val("");
            $("#dni").val("");
            $("#empresa").val("");
            $("#direcion").val("");
            $("#btnAdd").show();
            $("#btnUpdate, #btnCancel").hide();
        },
        edit: function(sender) {
            var id = $(sender).closest("tr").attr("data-id");
            var obj = this;
            var service = new ClienteService();
            service.get(id, function(user) {
                obj.bindForm(user);
                $("#btnAdd").hide();
                $("#btnUpdate, #btnCancel").show();
            });
        },
        deleteCliente: function(sender) {
            if (!confirm("Esta seguro que desea eliminar este registro?")) {
                return;
            }
            var id = $(sender).closest("tr").attr("data-id");
            var service = new ClienteService();
            service.deleteCliente(id, function() {
                $(sender).closest("tr").remove();
            });
        }
    };
})();


////////////////////**********  RECIBOS ********** //////////////////

var Recibo = function () {
    nova.data.Entity.call(this);
    this.cliente_id = "";
    this.fecha = "";
    this.iva = false;
    this.irpf = false;
    this.monto_total = 0;
};

Recibo.prototype = new nova.data.Entity();
Recibo.constructor = Recibo;

Recibo.prototype.updateFrom = function(recibo) {
    this.cliente_id = recibo.cliente_id;
    this.fecha = recibo.fecha;
    this.iva = recibo.iva;
    this.irpf = recibo.irpf;
    this.monto_total =  recibo.monto_total;
};

var ReciboService = function() {
};

ReciboService.prototype = {
    getAll: function (callback) {
        demo.db.getInstance().recibos.toArray(callback);
    },
    add:function(recibo, callback) {
        var db = demo.db.getInstance();
        //cliente.lastUpdatedTime = null;
        db.recibos.add(recibo);
        db.saveChanges(callback);
    },
    deleteRecibo:function(id, callback) {
        var db = demo.db.getInstance();
        db.recibos.removeByWhere("id=" + id, callback);
        db.recibosconceptos.removeByWhere("recibos_id=" + id, callback);
    },
    update:function(recibo, callback) {
        var db = demo.db.getInstance();
        db.recibos.where("id=" + recibo.id).firstOrDefault(function(dbRecibos) {
            dbRecibos.updateFrom(recibo);
            db.recibos.update(dbRecibos);
            db.saveChanges(function() {
                //cliente.lastUpdatedTime = dbCliente.lastUpdatedTime;
                callback && callback();
            });
        });
    },
    get:function(id, callback) {
        demo.db.getInstance().recibos.firstOrDefault(callback, "id=" + id);
    }
};

(function() {
    demo.pages.Recibos = function() {

    };

    demo.pages.Recibos.prototype = {
        onLoaded: function() {
            var obj = this;
            $("#btnAdd").click(function() {
                obj.add();
            });
            $("#btnUpdate").click(function() {
                obj.update();
            });
            $("#btnCancel").click(function() {
                obj.reset();
            });
            $(".btn-delete").live("click", function() {
                obj.deleteRecibo(this);
            });
            $(".btn-edit").live("click", function() {
                obj.edit(this);
            });

            $(".btn-imp").live("click", function() {
                obj.imp(this);
            });

            $("#txtconcepto_id").change(function() {
                obj.changeConcepto();
            });

                var service = new ClienteService();
                service.getAll(function(clientes) {
                    var html1 = "";
                    html1 += '<option value="0">Seleccione un Cliente</option>';
                    for (var i = 0; i < clientes.length; i++) {
                      //html1 += '<option value="' + i + '">' + i  + ' Traer nombre</option>';
                        html1 += obj.createRowHtml_cliente(clientes[i]);
                    }
                    $("#txtcliente_id").html(html1);
                });

                var service1 = new ConceptoService();
                service1.getAll(function(conceptos) {
                    var html1 = "";
                    html1 += '<option value="0">Seleccione un concepto</option>';
                    for (var i = 0; i < conceptos.length; i++) {
                      //html1 += '<option value="' + i + '">' + i  + ' Traer nombre</option>';
                        html1 += obj.createRowHtml_concepto(conceptos[i]);
                    }
                    $("#txtconcepto_id").html(html1);
                    $("#txtconcepto_id1").html(html1);
                });

            this.loadRecibos();
        },


        loadRecibos: function() {
            var obj = this;
            var service = new ReciboService();
            service.getAll(function(recibos) {
                var html = "";
                for (var i = 0; i < recibos.length; i++) {
                    html += obj.createRowHtml(recibos[i]);
                }
                $("#recibos").html(html);
            });
        },
        parseRecibo: function() {
            var recibo = new Recibo();
            recibo.id = $("#hfId").val() * 1;
            recibo.cliente_id = $("#txtcliente_id").val();
            recibo.fecha = $("#txtfecha").val();
            recibo.iva = $("#chck_iva").prop("checked");
            recibo.irpf = $("#chck_irpf").prop("checked");
            recibo.monto_total = $("#txtmonto").val();
            return recibo;
        },
        parseRecibosConceptos: function(id_recibo,i) {
            var recibosconceptos = new RecibosConceptos();
            recibosconceptos.id = $("#hfId").val() * 1;
            recibosconceptos.recibos_id = id_recibo;
            recibosconceptos.conceptos_id = $("#idcampo_"+i).val();
            recibosconceptos.monto_concepto = $("#campo_"+i).val();
            return recibosconceptos;
        },
        bindForm: function (recibo) {
            $("#hfId").val(recibo.id);
            $("#txtcliente_id").val(recibo.cliente_id);
            $("#txtfecha").val(recibo.fecha);
            $("#chck_iva").prop("checked",recibo.iva);
            $("#chck_irpf").prop("checked",recibo.irpf);
            $("#txtmonto").val(recibo.monto_total);
        },
        createRowHtml: function(recibo) {
            var html = '<tr data-id=' + recibo.id + '>\
                            <td>' + recibo.cliente_id + '</td>\
                            <td>' + recibo.fecha + '</td>\
                            <td>' + recibo.monto_total + '</td>\
                            <td>\
                                <input type="button" value="edit" class="btn-edit"/>\
                                <input type="button" value="delete" class="btn-delete"/>\
                                <input type="button" value="Imprimir" class="btn-imp"/>\
                            </td>\
                        </tr>';
            return html;
        },

        createRowHtml_cliente: function(cliente) {
            var html = '<option value="' + cliente.id + '">' + cliente.dni + ' - ' + cliente.nombres + ' ' + cliente.apellidos + '</option>';
            return html;
        },

        createRowHtml_concepto: function(concepto) {
            var html = '<option value="' + concepto.id + '">' + concepto.nomconcepto + '</option>';
            return html;
        },

        add: function() {
            var obj = this;
            var recibo = this.parseRecibo();
            var service = new ReciboService();
            service.add(recibo, function() {
                $("#recibos").append(obj.createRowHtml(recibo));

                //var x = número de campos existentes en el contenedor
                var x = $("#contenedor div").length;
                var FieldCount = x-1; //para el seguimiento de los campos

                for(i = 1; i<x; i++){
                    obj.addRecibosConceptos(recibo.id,i);
                }

                
                obj.reset();
            });
        },
        addRecibosConceptos: function(id_recibo,i) {
            var obj = this;
            var reciboconcepto = this.parseRecibosConceptos(id_recibo,i);
            var service = new ReciboConceptoService();
            service.add(reciboconcepto, function() {
                console.log("ReciboConcepto_ID: " + reciboconcepto.id);
            });
        },
        update: function() {
            var obj = this;
            var service = new ReciboService();
            var recibo = this.parseRecibo();
            service.update(recibo, function() {
                var $tr = $('tr[data-id="' + recibo.id + '"]');
                $tr.replaceWith(obj.createRowHtml(recibo));
                //var x = número de campos existentes en el contenedor
                var x = $("#contenedor div").length;
                var FieldCount = x-1; //para el seguimiento de los campos

                for(i = 1; i<x; i++){
                    obj.updateRecibosConceptos(recibo.id,i);
                }
                
                obj.reset();
                $("#formEdit")[0].reset();
            });
        },
        updateRecibosConceptos: function(id_recibo,i) {
            var obj = this;
            var reciboconcepto = this.parseRecibosConceptos(id_recibo,i);
            var service = new ReciboConceptoService();
            service.updateReciboConcepto(reciboconcepto, function() {
                //var $tr = $('tr[data-id="' + reciboconcepto.id + '"]');
                //$tr.replaceWith(obj.createRowHtml(recibo));
                obj.reset();
                $("#formEdit")[0].reset();
            });
        },
        reset: function() {
            $("#txtcliente_id").val("");
            $("#txtfecha").val("");
            $("#chck_iva").prop("checked",false);
            $("#chck_irpf").prop("checked",false);
            $("#txtmonto").val(0);
            $("#txtconcepto_id").val("");
            $("#btnAdd").show();
            $("#btnUpdate, #btnCancel").hide();

            //var x = número de campos existentes en el contenedor
            var x = $("#contenedor div").length;
            var FieldCount = x-1; //para el seguimiento de los campos

            for(i = 1; i<x; i++){
                $("#campo_"+i).val(0);
            }
            console.log("RESET: " + x);
        },
        edit: function(sender) {
            var id = $(sender).closest("tr").attr("data-id");
            var obj = this;
            var service = new ReciboService();
            service.get(id, function(recibo) {
                var db = demo.db.getInstance();
                db.recibosconceptos.where("recibos_id=" + recibo.id).toArray(function(reciboconceptos) {
                    var x = $("#contenedor div").length;
                    console.log("contenedor: " + x);
                    console.log("reciboconceptos: " + reciboconceptos.length);
                    for (i=0;i<reciboconceptos.length;i++){
                        var recibo = reciboconceptos[i];
                        var conceptobd = recibo.conceptos_id;
                        for(j = 1; j<x; j++){
                            //$("#campo_"+j).val(0);
                            conceptocampo = $("#idcampo_"+j).val();
                            if(conceptobd == conceptocampo){
                                $("#campo_"+j).val(recibo.monto_concepto);
                            }
                        }
                    }
                });
                
                obj.bindForm(recibo);
                $("#btnAdd").hide();
                $("#btnUpdate, #btnCancel").show();

            });
        },

        imp: function(sender) {
            var id = $(sender).closest("tr").attr("data-id");
            var db = demo.db.getInstance();
            var cliente_id;
            var fecha;
            var monto_total;
            var c_nombres;
            var c_apellidos;
            var c_domicilio;
            var montos;
            db.recibos.where("id=" + id).firstOrDefault(function(row_recibo) {
                cliente_id =  row_recibo.cliente_id;
                fecha = row_recibo.fecha;
                monto_total = row_recibo.monto_total;

               db.clientes.where("id=" + cliente_id).firstOrDefault(function(row_cliente){
                    c_nombres = row_cliente.nombres;
                    c_apellidos = row_cliente.apellidos;
                    c_domicilio = row_cliente.direcion;

                      location.href="reportes_.html?id="+ id +"&cliente_id=" + cliente_id + "&domicilio=" + c_domicilio + "&fecha=" + fecha + "&total=" + monto_total + "&nombres=" + c_nombres +"&apellidos=" + c_apellidos ;
                });

                /*db.recibosconceptos.where("recibos_id=" + id ).toArray(function(row_recibos_conceptos){
                    var j = 1;
                    for (i=0;i<row_recibos_conceptos.length;i++){
                        var recibo = row_recibos_conceptos[i];
                        var conceptobd = recibo.conceptos_id;
                        //console.log("recibo.conceptos_id : " + recibo.monto_concepto);
                        db.conceptos.where("id=" + conceptobd).firstOrDefault(function(dbConceptos) {
                            //console.log("recibo.conceptos_id : " + recibo.monto_concepto);
                            //console.log("dbConceptos.nomconcepto : " + dbConceptos.nomconcepto);
                            montos += "&concepto" + j + "=" + dbConceptos.nomconcepto + "&monto_concepto" + j + "=" + recibo.monto_concepto;
                            //console.log("montos: " + montos);
                        });
                        j++;
                    }
                    //console.log("montos: " + montos);
                        console.log("cliente_id: " + cliente_id);
                        console.log("c_domicilio: " + c_domicilio);
                        console.log("fecha: " + fecha);
                        console.log("monto_total: " + monto_total);
                        console.log("c_nombres: " + c_nombres);
                        console.log("c_apellidos: " + c_apellidos);
                        console.log("montos: " + montos);
                });*/

                
            });
            
            //alert(monto_concepto);
        },

        deleteRecibo: function(sender) {
            if (!confirm("Esta seguro que desea eliminar este registro?")) {
                return;
            }
            var id = $(sender).closest("tr").attr("data-id");
            var service = new ReciboService();
            service.deleteRecibo(id, function() {
                $(sender).closest("tr").remove();
            });
        },
        changeConcepto: function() {



            var text = $("#txtconcepto_id option:selected" ).html(); // OBTENGO EL TEXTO DEL CONCEPTO
            var value = $("#txtconcepto_id").val(); // OBTENGO EL VALUE

            if($("#txtconcepto_id").val() != 0){ // SI EL CONCEPTO ES = 0 NO SE HACE NADA
                var MaxInputs       = 8; //Número Maximo de Campos
                var contenedor       = $("#contenedor"); //ID del contenedor

                //var x = número de campos existentes en el contenedor
                var x = $("#contenedor div").length;
                var FieldCount = x-1; //para el seguimiento de los campos

                if(x <= MaxInputs) //max input box allowed
                {
                    for(i = 1; i<x; i++){
                        if(text == $("#nombre_concepto"+i).val())
                            return;
                    }
                    FieldCount++;
                    //agregar campo
                    html = '<div> \
                                <input class="ccformfield"  name="concepto[]" type="text" id="nombre_concepto' + FieldCount + '" placeholder="Concepto" readonly value="' + text + '"> \
                                <input type="hidden" name="idcampo_' + FieldCount + '" value="' + value + '" id="idcampo_' + FieldCount + '"/> \
                                <input type="text" name="mitexto[]" id="campo_' + FieldCount + '" \
                                placeholder="Ingrese el monto correspondiente ' + FieldCount + '" \
                                onkeypress="return valida(event, this);" onkeyup="sumar();"/> \
                                <a href="#" class="eliminar">&times;</a> \
                            </div>';
                    //$(contenedor).append('<div><input type="text" name="mitexto[]" id="campo_'+ FieldCount +'" placeholder="Ingrese el monto correspondiente '+ FieldCount +'" onkeypress="return valida(event);" onkeyup="sumar();"/><a href="#" class="eliminar">&times;</a></div>');
                    $(contenedor).append(html);
                    x++; //text box increment
                    //FieldCount++;
                }
            }


            $("body").on("click",".eliminar", function(e){ //click en eliminar campo
                if( x > 1 ) {
                    $(this).parent('div').remove(); //eliminar el campo
                    x--;
                    FieldCount--;
                }
                return false;
            });
        }



    };
})();



////////////////////////******* CONCEPTOS **********/////////////////////

var Concepto = function () {
    nova.data.Entity.call(this);
    this.nomconcepto = "";
    this.descripcion = "";
};

Concepto.prototype = new nova.data.Entity();
Concepto.constructor = Concepto;

Concepto.prototype.updateFrom = function(concepto) {
    this.nomconcepto = concepto.nomconcepto;
    this.descripcion = concepto.descripcion;
};

var ConceptoService = function() {
};

ConceptoService.prototype = {
    getAll: function (callback) {
        demo.db.getInstance().conceptos.toArray(callback);
    },
    add:function(concepto, callback) {
        var db = demo.db.getInstance();
        db.conceptos.add(concepto);
        db.saveChanges(callback);
    },
    deleteConcepto:function(id, callback) {
        var db = demo.db.getInstance();
        db.conceptos.removeByWhere("id=" + id, callback);
    },
    update:function(concepto, callback) {
        var db = demo.db.getInstance();
        db.concepto.where("id=" + concepto.id).firstOrDefault(function(dbConceptos) {
            dbConceptos.updateFrom(concepto);
            db.conceptos.update(dbConceptos);
            db.saveChanges(function() {
                callback && callback();
            });
        });
    },
    get:function(id, callback) {
        demo.db.getInstance().conceptos.firstOrDefault(callback, "id=" + id);
    }
};

(function() {
    demo.pages.Conceptos = function() {

    };

    demo.pages.Conceptos.prototype = {
        onLoaded: function() {
            var obj = this;
            $("#btnAdd").click(function() {
                obj.add();
            });
            $("#btnUpdate").click(function() {
                obj.update();
            });
            $("#btnCancel").click(function() {
                obj.reset();
            });
            $(".btn-delete").live("click", function() {
                obj.deleteConcepto(this);
            });
            $(".btn-edit").live("click", function() {
                obj.edit(this);
            });

            this.loadConceptos();
        },


        loadConceptos: function() {
            var obj = this;
            var service = new ConceptoService();
            service.getAll(function(conceptos) {
                var html = "";
                for (var i = 0; i < conceptos.length; i++) {
                    html += obj.createRowHtml(conceptos[i]);
                }
                $("#conceptos").html(html);
            });
        },
        parseConcepto: function() {
            var concepto = new Concepto();
            concepto.id = $("#hfId").val() * 1;
            concepto.nomconcepto = $("#txt_nombre_concepto").val();
            concepto.descripcion = $("#txt_descripcion").val();
            return concepto;
        },
        bindForm: function (concepto) {
            $("#hfId").val(concepto.id);
            $("#txt_nombre_concepto").val(concepto.nomconcepto);
            $("#txt_descripcion").val(concepto.descripcion);
        },
        createRowHtml: function(concepto) {
            var html = '<tr data-id=' + concepto.id + '>\
                            <td>' + concepto.nomconcepto + '</td>\
                            <td>' + concepto.descripcion + '</td>\
                            <td>\
                                <input type="button" value="delete" class="btn-delete"/>\
                            </td>\
                        </tr>';
            return html;
        },

        add: function() {
            var obj = this;
            var concepto = this.parseConcepto();
            var service = new ConceptoService();
            service.add(concepto, function() {
                $("#conceptos").append(obj.createRowHtml(concepto));
                obj.reset();
            });
        },
        update: function() {
            var obj = this;
            var service = new ConceptoService();
            var concepto = this.parseConcepto();
            service.update(concepto, function() {
                var $tr = $('tr[data-id="' + concepto.id + '"]');
                $tr.replaceWith(obj.createRowHtml(concepto));
                obj.reset();
                $("#formEdit")[0].reset();
            });
        },
        reset: function() {
            $("#txt_nombre_concepto").val("");
            $("#txt_descripcion").val("");
            $("#btnAdd").show();
            $("#btnUpdate, #btnCancel").hide();
        },
        edit: function(sender) {
            var id = $(sender).closest("tr").attr("data-id");
            var obj = this;
            var service = new ConceptoService();
            service.get(id, function(concepto) {
                obj.bindForm(concepto);
                $("#btnAdd").hide();
                $("#btnUpdate, #btnCancel").show();
            });
        },
        deleteConcepto: function(sender) {
            if (!confirm("Esta seguro que desea eliminar este registro?")) {
                return;
            }
            var id = $(sender).closest("tr").attr("data-id");
            var service = new ConceptoService();
            service.deleteConcepto(id, function() {
                $(sender).closest("tr").remove();
            });
        }
    };
})();



////////////////////////******* RECIBOS-CONCEPTOS **********/////////////////////

var RecibosConceptos = function () {
    nova.data.Entity.call(this);
    this.recibos_id = "";
    this.conceptos_id = "";
    this.monto_concepto = 0;
};

RecibosConceptos.prototype = new nova.data.Entity();
RecibosConceptos.constructor = RecibosConceptos;

RecibosConceptos.prototype.updateFrom = function(recibosconceptos) {
    this.recibos_id = recibosconceptos.recibos_id;
    this.conceptos_id = recibosconceptos.conceptos_id;
    this.monto_concepto = recibosconceptos.monto_concepto;
};

var ReciboConceptoService = function() {
};

ReciboConceptoService.prototype = {
    getAll: function (callback) {
        demo.db.getInstance().recibosconceptos.toArray(callback);
    },
    add:function(reciboconcepto, callback) {
        var db = demo.db.getInstance();
        db.recibosconceptos.add(reciboconcepto);
        db.saveChanges(callback);
    },
    deleteReciboConcepto:function(id, callback) {
        var db = demo.db.getInstance();
        db.recibosconceptos.removeByWhere("id=" + id, callback);
    },
    update:function(reciboconcepto, callback) {
        var db = demo.db.getInstance();
        db.reciboconcepto.where("id=" + reciboconcepto.id).firstOrDefault(function(dbReciboConceptos) {
            dbRecibosConceptos.updateFrom(reciboconcepto);
            db.recibosconceptos.update(dbReciboConceptos);
            db.saveChanges(function() {
                callback && callback();
            });
        });
    },
    updateReciboConcepto:function(reciboconcepto, callback) {
        var db = demo.db.getInstance();
        db.recibosconceptos.where("recibos_id=" + reciboconcepto.id + " and conceptos_id=" + reciboconcepto.conceptos_id).firstOrDefault(function(dbRecibosConceptos) {
            dbRecibosConceptos.updateFrom(reciboconcepto);
            db.recibosconceptos.update(dbRecibosConceptos);
            db.saveChanges(function() {
                //cliente.lastUpdatedTime = dbCliente.lastUpdatedTime;
                callback && callback();
            });
        });
    },
    get:function(id, callback) {
        demo.db.getInstance().recibosconceptos.firstOrDefault(callback, "id=" + id);
    }
};

(function() {
    demo.pages.ReciboConceptos = function() {

    };

    demo.pages.ReciboConceptos.prototype = {
        onLoaded: function() {
            var obj = this;
            $("#btnAdd").click(function() {
                obj.add();
            });
            $("#btnUpdate").click(function() {
                obj.update();
            });
            $("#btnCancel").click(function() {
                obj.reset();
            });
            $(".btn-delete").live("click", function() {
                obj.deleteReciboConcepto(this);
            });
            $(".btn-edit").live("click", function() {
                obj.edit(this);
            });

            this.loadConceptos();
        },


        loadReciboConceptos: function() {
            var obj = "recibir variable";

                $("#recibosconceptos_id").html(obj);
        },
        parseReciboConcepto: function() {
          
            return recibosconcepto;
        },
        bindForm: function (reciboconcepto) {
            
        },
        createRowHtml: function(reciboconcepto) {
            
        },

        add: function() {
            
        },
        update: function() {
            
        },
        reset: function() {
            
        },
        edit: function(sender) {
            
        },
        deleteReciboConcepto: function(sender) {
            
        }
    };
})();

