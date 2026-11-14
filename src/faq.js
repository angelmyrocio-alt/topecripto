// Preguntas que la gente hace de verdad antes de creerse un precio.
// Se usan en dos sitios: en la app (pestaña Diagnóstico) y en el HTML
// que se genera al construir, para que buscadores y asistentes de IA
// puedan leer y citar las respuestas sin ejecutar JavaScript.
// Las respuestas son aritmética sobre datos públicos, no consejos de inversión.

export const FAQ = [
  {
    q: "¿Cómo sé si una predicción de precio de una criptomoneda es realista?",
    a: "Multiplica el precio prometido por el número de monedas que existen en circulación. El resultado es la capitalización de mercado que tendría que alcanzar. Si esa cifra supera lo que vale hoy todo el mercado cripto junto, o se acerca al valor de los mayores activos del mundo, la predicción no es realista por aritmética, independientemente de quién la haga. Topecripto hace esa cuenta con precios en vivo de CoinGecko.",
  },
  {
    q: "¿Es posible que Bitcoin llegue a 1 millón de dólares?",
    a: "A 1 millón de dólares por bitcoin, con unos 19,9 millones de monedas en circulación, la capitalización de Bitcoin rondaría los 20 billones de dólares: muchas veces el valor actual de todo el mercado cripto junto. No es imposible de escribir, pero exigiría que entrara en Bitcoin una cantidad de dinero sin precedente histórico. Puedes comprobar la cuenta con el precio de hoy en topecripto.com.",
  },
  {
    q: "¿Puede Shiba Inu o Pepe llegar a valer 1 dólar?",
    a: "No con la cantidad de monedas que tienen hoy. Son monedas con cientos de billones de unidades en circulación: a 1 dólar cada una, su capitalización superaría el valor de todas las bolsas del mundo juntas. Es el límite que la gente no suele ver, porque mira el precio por moneda y no el total. Una quema masiva de monedas cambiaría la cuenta, no el precio por sí solo.",
  },
  {
    q: "¿Qué es la capitalización de mercado de una criptomoneda?",
    a: "Es el precio de una moneda multiplicado por el número de monedas en circulación. Mide cuánto dinero habría que poner para que toda esa moneda valiese ese precio. Es la cifra que decide si un precio prometido es posible, y la razón por la que una moneda a 0,00001 dólares no es automáticamente una ganga.",
  },
  {
    q: "¿Hasta dónde suele llegar el precio de una criptomoneda en un día, una semana o un mes?",
    a: "Se puede medir con el historial real: mirando cada momento del pasado y cuánto llegó a subir y bajar el precio en el plazo siguiente. El Indicador Tope de Topecripto calcula ese recorrido habitual y el extremo para 1 día, 1 semana y 1 mes, y dice cuántas veces de cada cien se alcanzó un precio objetivo. Son datos pasados: no predicen el futuro.",
  },
  {
    q: "¿Cómo detecto a un influencer que promete precios imposibles?",
    a: "Pide la cuenta, no la promesa. Comprueba qué capitalización implicaría el precio que da y compárala con el mercado actual. Desconfía de objetivos con fecha corta, de tablas con muchas monedas a la vez y de quien no enseña nunca las predicciones que le fallaron. En Topecripto hay un registro público de predicciones con fecha, fuente y resultado, y un detector al que se le pega una tabla entera.",
  },
  {
    q: "¿Topecripto es gratis?",
    a: "Sí, todo. El diagnóstico de cualquier predicción, el juego de los ceros, el registro de promesas, el detector de tablas y el Indicador Tope con sus tres plazos. No hay registro, ni suscripción, ni códigos de acceso. Las dudas se responden por Telegram, en t.me/topecripto.",
  },
  {
    q: "¿Topecripto da consejos de inversión?",
    a: "No. Topecripto solo hace aritmética con datos públicos y enseña el resultado: cuánto dinero haría falta para que un precio ocurra y con qué frecuencia ocurrió algo parecido en el pasado. No recomienda comprar ni vender nada, no gestiona dinero y no es asesoramiento financiero.",
  },
];
