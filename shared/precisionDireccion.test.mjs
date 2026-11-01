// Que tan seguro es el punto de una direccion y que zona cobrar si no lo es.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  alturaEscrita,
  calificarResultado,
  numeroDeLaPuerta,
  numeroEnEtiqueta,
  puntosAlrededor,
  radioDeAlturaUbicada,
  verificarPuertas,
  zonaConDuda,
} from "./precisionDireccion.js";

test("Padre Zacarias 1400: la puerta 400 que devuelve el mapa es OTRA casa y se descarta", () => {
  const c = calificarResultado({ label: "400, Padre Zacarías, Chivilcoy", calidad: "house", numero: "400" }, "padre zacarias 1400");
  assert.equal(c.descartar, true);
  const lista = verificarPuertas(
    [
      { label: "400, Padre Zacarías, Chivilcoy", calidad: "house", numero: "400", engine: "photon" },
      { label: "Padre Zacarías, Chivilcoy", calidad: "residential", engine: "nominatim" },
    ],
    "padre zacarias 1400",
  );
  assert.equal(lista.length, 1);
  assert.equal(lista[0].precision, "calle");
});

test("la puerta justa es exacta; la de la misma cuadra es aproximada con su radio", () => {
  const exacta = calificarResultado({ label: "955, Ayacucho, Chivilcoy", calidad: "house", numero: "955" }, "ayacucho 955");
  assert.deepEqual([exacta.precision, exacta.radioM, exacta.descartar], ["exacta", 0, false]);
  const cercana = calificarResultado({ label: "Ayacucho 931, Chivilcoy", calidad: "house", numero: "931" }, "Ayacucho 955");
  assert.equal(cercana.precision, "cercana");
  assert.equal(cercana.descartar, false);
  assert.ok(cercana.radioM > 40 && cercana.radioM < 80, String(cercana.radioM));
  // Cercana: el engine queda marcado como aproximacion (no se guarda como la casa).
  const [v] = verificarPuertas([{ label: "Ayacucho 931", calidad: "house", numero: "931", engine: "mapbox" }], "ayacucho 955");
  assert.equal(v.engine, "mapbox-altura-cercana");
});

test("rango de puertas, letra y numero en la etiqueta cuando el proveedor no lo da aparte", () => {
  assert.deepEqual(numeroDeLaPuerta("953-957"), { desde: 953, hasta: 957 });
  assert.deepEqual(numeroDeLaPuerta("955 A"), { desde: 955, hasta: 955 });
  assert.equal(numeroDeLaPuerta("s/n"), null);
  assert.equal(calificarResultado({ label: "x", calidad: "house", numero: "953-957" }, "ayacucho 955").precision, "exacta");
  assert.equal(numeroEnEtiqueta("955, Ayacucho, Chivilcoy", "ayacucho 955"), 955);
  assert.equal(numeroEnEtiqueta("Ayacucho 955, B6620 Chivilcoy", "ayacucho 955"), 955);
  // Calle numerada: el 88 es el nombre de la calle, no la puerta.
  assert.equal(numeroEnEtiqueta("Calle 88 275, Chivilcoy", "calle 88 275"), 275);
  assert.equal(numeroEnEtiqueta("Calle 88, Chivilcoy", "calle 88 275"), null);
});

test("sin altura escrita ('Calle 111') no se compara numero; una puerta sin numero no es la casa", () => {
  assert.equal(alturaEscrita("Calle 111"), null);
  assert.equal(alturaEscrita("calle 111 849"), 849);
  assert.equal(alturaEscrita("av 3 de febrero 849"), 849);
  assert.equal(calificarResultado({ label: "Calle 111", calidad: "house", numero: "20" }, "Calle 111").precision, "exacta");
  const edificio = verificarPuertas([{ label: "Escuela, Ayacucho", calidad: "building", engine: "nominatim" }], "ayacucho 955");
  assert.equal(edificio[0].precision, "calle");
  assert.equal(edificio[0].calidad, "sin_numero");
});

test("Google/Mapbox interpolados: aceptados con poca duda", () => {
  const c = calificarResultado({ label: "Ayacucho 955", calidad: "house", numero: "955", interpolada: true }, "ayacucho 955");
  assert.equal(c.precision, "interpolada");
  assert.ok(c.radioM > 0 && c.radioM <= 50);
});

test("radio de las puertas de la calle (Overpass): mas lejos, mas duda", () => {
  assert.equal(radioDeAlturaUbicada("exacta", 0), 0);
  assert.ok(radioDeAlturaUbicada("interpolada", 100) < radioDeAlturaUbicada("interpolada", 1000));
  assert.ok(radioDeAlturaUbicada("extrapolada", 200) > radioDeAlturaUbicada("extrapolada", 50));
});

// Dos zonas lado a lado: Zona 1 al oeste de la longitud -60.000, Zona 2 al este.
const Z1 = { id: "z1", name: "Zona 1", fee: 2500 };
const Z2 = { id: "z2", name: "Zona 2", fee: 3500 };
const zonaDe = (p) => (p.lng < -60 ? Z1 : p.lng < -59.98 ? Z2 : null);

test("punto exacto: la zona del punto, sin duda", () => {
  const r = zonaConDuda({ lat: -34.9, lng: -60.0005 }, 0, zonaDe);
  assert.equal(r.zona?.id, "z1");
  assert.equal(r.dudosa, false);
});

test("punto aproximado cerca del limite: se cobra la zona mas cara y queda dudosa", () => {
  // A unos 45 m del limite, con 120 m de duda.
  const r = zonaConDuda({ lat: -34.9, lng: -60.0005 }, 120, zonaDe);
  assert.equal(r.zona?.id, "z2");
  assert.equal(r.dudosa, true);
  assert.deepEqual(r.posibles.map((z) => z.id), ["z1", "z2"]);
});

test("punto aproximado lejos del limite: su zona, sin duda", () => {
  const r = zonaConDuda({ lat: -34.9, lng: -60.01 }, 120, zonaDe);
  assert.equal(r.zona?.id, "z1");
  assert.equal(r.dudosa, false);
});

test("si el punto cae fuera del area, sigue siendo fuera", () => {
  const r = zonaConDuda({ lat: -34.9, lng: -59.97 }, 2000, zonaDe);
  assert.equal(r.zona, null);
});

test("los puntos de alrededor estan a la distancia pedida", () => {
  const centro = { lat: -34.9, lng: -60 };
  const puntos = puntosAlrededor(centro, 100);
  assert.equal(puntos.length, 25);
  const este = puntos[1];
  const metros = (este.lng - centro.lng) * 111_320 * Math.cos((centro.lat * Math.PI) / 180);
  assert.ok(Math.abs(metros - 100) < 1, String(metros));
});
