// Composición de saldos — datos de cada cuenta (una pestaña del sheet por cuenta).
//
// Cómo actualizar:
//   · Lo más rápido: botón "Importar Excel" en la página (perfil Admin) — lee el .xlsx y carga la cuenta.
//   · A mano: "comprobantes" = una fila del bloque COMPOSICIÓN DE SALDO por objeto.
//       importe / importeOrigen como número (sin $ ni puntos de miles).
//       fecha y vencimiento en formato "AAAA-MM-DD".
//   · "ficha": portal, código, cuit, usuario, contraseña, plazo y "acuerdos" (% por concepto).
//   · "sncPendientes": el cuadro de la derecha del sheet. Importes en negativo.
//   · "pendientesOP": resumen que llega de la sección Órdenes de pago.
//   · Días de emisión, días vencido, subtotales y saldo se calculan solos.
//   · Los "id" coinciden con los slugs de la app (logos en logos/<id>.png).

export const fechaCorte = "2026-08-24";

export const cuentas = [
  {
    "id": "diarco",
    "nombre": "Autoservicio Mayorista Diarco",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "",
        "escala": "",
        "noDev": "1%",
        "log": "17%",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "533"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "carrefour",
    "nombre": "Carrefour",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "",
        "escala": "",
        "noDev": "1%",
        "log": "9%",
        "publ": "",
        "voraz": "5%",
        "criadores": "10%",
        "kongo": "10%"
      },
      "codigoAcuerdo": "1857"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 6,
      "monto": -37744679
    }
  },
  {
    "id": "makro",
    "nombre": "Supermercado Mayorista Makro",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "6%",
        "escala": "",
        "noDev": "",
        "log": "10,35%",
        "publ": "",
        "voraz": "",
        "criadores": "5%",
        "kongo": ""
      },
      "codigoAcuerdo": "1578"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 9,
      "monto": -19223874
    }
  },
  {
    "id": "toledo",
    "nombre": "Supermercado Toledo S.A.",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "",
        "escala": "",
        "noDev": "1%",
        "log": "3,00%",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "739"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "nini",
    "nombre": "Ricardo Nini S.A.",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "5%",
        "escala": "",
        "noDev": "1%",
        "log": "",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "489"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "alberdi",
    "nombre": "Alberdi SA",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "",
        "escala": "",
        "noDev": "2%",
        "log": "",
        "publ": "1%",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "552"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "dorinka",
    "nombre": "Dorinka SRL",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "2%",
        "escala": "",
        "noDev": "",
        "log": "",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "518"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "cencosud",
    "nombre": "Cencosud S.A.",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "",
        "escala": "3%",
        "noDev": "1%",
        "log": "9%",
        "publ": "3%",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "857"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 4,
      "monto": -8356599
    }
  },
  {
    "id": "la-anonima",
    "nombre": "La Anonima",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "2%",
        "escala": "",
        "noDev": "1%",
        "log": "13%",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "1884"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "sodimac",
    "nombre": "Sodimac",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "1%",
        "escala": "",
        "noDev": "1%",
        "log": "3%",
        "publ": "1,00%",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "1741"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "la-esperanza",
    "nombre": "La Esperanza S.R.L",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "",
        "escala": "",
        "noDev": "",
        "log": "",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "1623"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "aiello",
    "nombre": "Supermercado Aiello S.A",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "",
        "escala": "",
        "noDev": "",
        "log": "3%",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "1618"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  },
  {
    "id": "coto",
    "nombre": "Coto Centro Integral de Comerc",
    "ficha": {
      "opBaires": "COTO",
      "portalNombre": "COTO Informa",
      "portalUrl": "https://www.cotoinforma.com.ar/",
      "codigoProveedor": "180180",
      "cuit": "33 – 70726132 – 9",
      "usuario": "",
      "contra": "Baires26",
      "plazo": "75-75 días",
      "acuerdo": "",
      "acuerdos": {
        "acc": "35%",
        "escala": "",
        "noDev": "",
        "log": "6%",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "1465"
    },
    "sncPendientes": [
      {
        "categoria": "Devolución",
        "importe": -2901000.85,
        "nota": "ange/vende"
      },
      {
        "categoria": "SNC mercadería",
        "importe": -266818.56,
        "nota": "ange"
      },
      {
        "categoria": "SNC servicios",
        "importe": -6230000.15,
        "nota": "majo/ogistic (mail ange consulta SNC pendientes el 30/7)"
      },
      {
        "categoria": "NC mkt",
        "importe": -2420000,
        "nota": ""
      }
    ],
    "comprobantes": [
      {
        "fecha": "2026-01-14",
        "numFactura": "7671",
        "vencimiento": "2026-03-30",
        "importe": 416857.25,
        "importeOrigen": 3624999.08,
        "condPago": "75-75 Dias",
        "observacion": "21401287093",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-02-04",
        "numFactura": "89",
        "vencimiento": "2026-04-20",
        "importe": 393542.75,
        "importeOrigen": 16493183.32,
        "condPago": "75-75 Dias",
        "observacion": "21446770093",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-02-12",
        "numFactura": "95",
        "vencimiento": "2026-04-28",
        "importe": 231049.81,
        "importeOrigen": 7979456.08,
        "condPago": "75-75 Dias",
        "observacion": "21462073093",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-03-05",
        "numFactura": "121",
        "vencimiento": "2026-05-19",
        "importe": 324680.74,
        "importeOrigen": 12179768.29,
        "condPago": "75-75 Dias",
        "observacion": "1-NP-6214",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-03-12",
        "numFactura": "139",
        "vencimiento": "2026-05-26",
        "importe": 318468.57,
        "importeOrigen": 9298477.4,
        "condPago": "75-75 Dias",
        "observacion": "1-NP-7451",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-03-30",
        "numFactura": "158",
        "vencimiento": "2026-06-13",
        "importe": 288468.17,
        "importeOrigen": 12596133.16,
        "condPago": "75-75 Dias",
        "observacion": "1-NP-7957",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-04-25",
        "numFactura": "216",
        "vencimiento": "2026-07-09",
        "importe": 627045.46,
        "importeOrigen": 22116899.69,
        "condPago": "75-75 Dias",
        "observacion": "21614749093",
        "comentario": "pend serv desc + evento mkt"
      },
      {
        "fecha": "2026-05-08",
        "numFactura": "232",
        "vencimiento": "2026-07-22",
        "importe": 824250.58,
        "importeOrigen": 9721647.77,
        "condPago": "75-75 Dias",
        "observacion": "1-NP-10920",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-05-08",
        "numFactura": "10269",
        "vencimiento": "2026-07-22",
        "importe": 4965637.79,
        "importeOrigen": 4965637.79,
        "condPago": "75-75 Dias",
        "observacion": "1-NP-10601",
        "comentario": "ENVIADA A CONTABILIZAR"
      },
      {
        "fecha": "2026-05-16",
        "numFactura": "10481",
        "vencimiento": "2026-07-30",
        "importe": 4143083.19,
        "importeOrigen": 4143083.19,
        "condPago": "75-75 Dias",
        "observacion": "21649027093",
        "comentario": "ENVIADA A CONTABILIZAR"
      },
      {
        "fecha": "2026-05-29",
        "numFactura": "264",
        "vencimiento": "2026-08-12",
        "importe": 3227886.29,
        "importeOrigen": 12085621.54,
        "condPago": "75-75 Dias",
        "observacion": "58035463093",
        "comentario": "pend devolucion grande + serv desc"
      },
      {
        "fecha": "2026-06-05",
        "numFactura": "277",
        "vencimiento": "2026-08-19",
        "importe": 159151.88,
        "importeOrigen": 38889568.92,
        "condPago": "75-75 Dias",
        "observacion": "21697688093",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-06-16",
        "numFactura": "298",
        "vencimiento": "2026-08-30",
        "importe": 457951.22,
        "importeOrigen": 9338364.14,
        "condPago": "75-75 Dias",
        "observacion": "21710563093",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-06-23",
        "numFactura": "314",
        "vencimiento": "2026-09-06",
        "importe": 211346.26,
        "importeOrigen": 13855182.62,
        "condPago": "75-75 Dias",
        "observacion": "1-NP-13438",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-06-30",
        "numFactura": "324",
        "vencimiento": "2026-09-13",
        "importe": 1591251.29,
        "importeOrigen": 11117292.47,
        "condPago": "75-75 Dias",
        "observacion": "21734365093",
        "comentario": "pendiente resolver nc x servicios de descarga"
      },
      {
        "fecha": "2026-07-25",
        "numFactura": "355",
        "vencimiento": "2026-10-08",
        "importe": 44123194.84,
        "importeOrigen": 64364317.97,
        "condPago": "75-75 Dias",
        "observacion": "21786738093",
        "comentario": ""
      },
      {
        "fecha": "2026-07-25",
        "numFactura": "356",
        "vencimiento": "2026-10-08",
        "importe": 41338673.25,
        "importeOrigen": 71338673.25,
        "condPago": "75-75 Dias",
        "observacion": "21786738093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-05",
        "numFactura": "378",
        "vencimiento": "2026-10-19",
        "importe": 12223499.53,
        "importeOrigen": 12223499.53,
        "condPago": "75-75 Dias",
        "observacion": "21802758093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-05",
        "numFactura": "379",
        "vencimiento": "2026-10-19",
        "importe": 12789256.99,
        "importeOrigen": 12789256.99,
        "condPago": "75-75 Dias",
        "observacion": "21812294093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-05",
        "numFactura": "380",
        "vencimiento": "2026-10-19",
        "importe": 6116261.63,
        "importeOrigen": 6116261.63,
        "condPago": "75-75 Dias",
        "observacion": "43318345093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-05",
        "numFactura": "12470",
        "vencimiento": "2026-10-19",
        "importe": 3538859.44,
        "importeOrigen": 3538859.44,
        "condPago": "75-75 Dias",
        "observacion": "21805942093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-18",
        "numFactura": "12778",
        "vencimiento": "2026-11-01",
        "importe": 1176308.79,
        "importeOrigen": 1176308.79,
        "condPago": "75-75 Dias",
        "observacion": "21820601093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-18",
        "numFactura": "12779",
        "vencimiento": "2026-11-01",
        "importe": 1471020.46,
        "importeOrigen": 1471020.46,
        "condPago": "75-75 Dias",
        "observacion": "21825023093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-18",
        "numFactura": "22111",
        "vencimiento": "2026-08-18",
        "importe": -7678977.02,
        "importeOrigen": 7678977.02,
        "condPago": "75-75 Dias",
        "observacion": "Echeq Banco Frances",
        "comentario": ""
      },
      {
        "fecha": "2026-08-18",
        "numFactura": "389",
        "vencimiento": "2026-11-01",
        "importe": 13102246.89,
        "importeOrigen": 13102246.89,
        "condPago": "75-75 Dias",
        "observacion": "21831210093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-19",
        "numFactura": "409",
        "vencimiento": "2026-11-02",
        "importe": -36682.86,
        "importeOrigen": 36682.86,
        "condPago": "75-75 Dias",
        "observacion": "Nc x merc no entregada- Fact 138- Rti 219585",
        "comentario": ""
      },
      {
        "fecha": "2026-08-20",
        "numFactura": "411",
        "vencimiento": "2026-11-03",
        "importe": -129711.17,
        "importeOrigen": 129711.17,
        "condPago": "75-75 Dias",
        "observacion": "Nc x dev de merc x envases dañados en fact 378- 379 - 380 - Rtos 225373- 225372- 225370",
        "comentario": ""
      },
      {
        "fecha": "2026-08-22",
        "numFactura": "12882",
        "vencimiento": "2026-11-05",
        "importe": 50774.73,
        "importeOrigen": 50774.73,
        "condPago": "75-75 Dias",
        "observacion": "44382662093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-22",
        "numFactura": "12883",
        "vencimiento": "2026-11-05",
        "importe": 5260430.61,
        "importeOrigen": 5260430.61,
        "condPago": "75-75 Dias",
        "observacion": "21839264093",
        "comentario": ""
      },
      {
        "fecha": "2026-08-22",
        "numFactura": "401",
        "vencimiento": "2026-11-05",
        "importe": 20788049.39,
        "importeOrigen": 20788049.39,
        "condPago": "75-75 Dias",
        "observacion": "21845831093",
        "comentario": ""
      }
    ],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 25,
      "monto": -4747888
    }
  },
  {
    "id": "almacor",
    "nombre": "Coop. De Prov. Y Cto Almacor L",
    "ficha": {
      "opBaires": "",
      "portalNombre": "",
      "portalUrl": "",
      "codigoProveedor": "",
      "cuit": "",
      "usuario": "",
      "contra": "",
      "plazo": "",
      "acuerdo": "",
      "acuerdos": {
        "acc": "5%",
        "escala": "",
        "noDev": "",
        "log": "",
        "publ": "",
        "voraz": "",
        "criadores": "",
        "kongo": ""
      },
      "codigoAcuerdo": "704"
    },
    "sncPendientes": [],
    "comprobantes": [],
    "pendientesOP": {
      "fuente": "Órdenes de pago",
      "cantidad": 0,
      "monto": 0
    }
  }
];
