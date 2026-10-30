/* Contenido: comidas modelo, opciones del formulario, guía para comer afuera y alertas de salud. */
(function (NG) {
  NG.MEAL_TYPES = {
    desayuno: { n: 'Desayuno', e: '☀️' },
    colacion: { n: 'Colación', e: '🍎' },
    almuerzo: { n: 'Almuerzo', e: '🍽️' },
    merienda: { n: 'Merienda', e: '☕' },
    cena: { n: 'Cena', e: '🌙' },
  };

  // Reparto de energía por cantidad de comidas: [tipo, %, hora]
  NG.MEAL_SETS = {
    2: [['almuerzo', 50, '13:00'], ['cena', 50, '20:30']],
    3: [['desayuno', 30, '08:00'], ['almuerzo', 40, '13:00'], ['cena', 30, '21:00']],
    4: [['desayuno', 25, '08:00'], ['almuerzo', 30, '13:00'], ['merienda', 15, '17:30'], ['cena', 30, '21:00']],
    5: [['desayuno', 20, '08:00'], ['colacion', 10, '10:30'], ['almuerzo', 30, '13:00'], ['merienda', 15, '17:30'], ['cena', 25, '21:00']],
    6: [['desayuno', 20, '07:30'], ['colacion', 10, '10:30'], ['almuerzo', 25, '13:00'], ['merienda', 15, '17:00'], ['cena', 20, '20:30'], ['colacion', 10, '22:30']],
  };

  NG.CTX = {
    casa: { n: 'En casa', e: '🏠' },
    trabajo: { n: 'Trabajo / estudio', e: '💼' },
    afuera: { n: 'Afuera / compro', e: '🛍️' },
  };

  NG.TAGS = { normal: '', pre: 'Pre-entreno', post: 'Post-entreno' };

  /* Comidas modelo para el generador automático.
     s: dm = desayuno/merienda · ac = almuerzo/cena · sn = colación
     it: [alimento, gramos sugeridos, fijo?] — los no fijos se ajustan al objetivo de la comida.
     pre: apta antes de entrenar (poca grasa y fibra) · buy: se compra lista */
  NG.COMBOS = [
    // Desayunos / meriendas
    { id: 'yog_avena', s: 'dm', pre: 1, n: 'Yogur griego con avena, fruta y chía', it: [['yogriego', 200], ['avena', 30], ['banana', 60], ['chia', 10]] },
    { id: 'tost_huevo', s: 'dm', n: 'Tostadas integrales con huevos revueltos y palta', it: [['panint', 56], ['huevo', 100], ['palta', 40], ['tomate', 60, 1]] },
    { id: 'tost_jyq', s: 'dm', pre: 1, n: 'Tostadas con jamón y queso + café con leche', it: [['panint', 56], ['jamon', 40], ['quesofresco', 30], ['lechedesc', 200], ['cafe', 100, 1]] },
    { id: 'licuado', s: 'dm', pre: 1, n: 'Licuado proteico de banana y avena', it: [['lechedesc', 250], ['whey', 30], ['banana', 120], ['avena', 30], ['pastamani', 8]] },
    { id: 'panq', s: 'dm', pre: 1, n: 'Panqueques de avena y banana', it: [['avena', 40], ['huevo', 50], ['clara', 99], ['banana', 60], ['miel', 7, 1]] },
    { id: 'arroz_pavo', s: 'dm', pre: 1, n: 'Tostadas de arroz con queso untable, jamón y fruta', it: [['tostarroz', 36], ['untable', 20], ['jamon', 60], ['manzana', 180]] },
    { id: 'yog_granola', s: 'dm', pre: 1, n: 'Yogur proteico con granola y frutos rojos', it: [['yogprot', 200], ['granola', 30], ['frutosrojos', 100]] },
    { id: 'cottage_tost', s: 'dm', pre: 1, n: 'Tostadas integrales con cottage, mermelada y fruta', it: [['panint', 56], ['cottage', 100], ['mermelada', 15, 1], ['kiwi', 75]] },
    { id: 'tofu_rev', s: 'dm', n: 'Tofu revuelto con tostadas integrales y palta', it: [['tofu', 150], ['panint', 56], ['palta', 40], ['tomate', 60, 1]] },
    { id: 'avena_veg', s: 'dm', pre: 1, n: 'Avena con bebida de soja, proteína vegetal y banana', it: [['bebsoja', 250], ['avena', 40], ['protveg', 30], ['banana', 60], ['pastamani', 8]] },
    { id: 'hummus_tost', s: 'dm', n: 'Tostadas con hummus y tomate + bebida de soja', it: [['panint', 56], ['hummus', 45], ['bebsoja', 200], ['tomate', 60, 1], ['naranja', 150]] },
    { id: 'tost_jamon_palta', s: 'dm', n: 'Tostadas integrales con jamón, palta y tomate + café con leche', it: [['panint', 56], ['jamon', 60], ['palta', 30], ['tomate', 60, 1], ['lechedeslac', 200], ['cafe', 100, 1]] },
    { id: 'yog_deslac', s: 'dm', pre: 1, n: 'Yogur deslactosado con avena y banana + tostadas de arroz con jamón', it: [['yogdeslac', 200], ['avena', 30], ['banana', 60], ['tostarroz', 18], ['jamon', 60]] },
    // Desayunos y meriendas de todos los días en Argentina (pop = familiar · eco = económico)
    { id: 'mate_tost_qb', s: 'dm', pop: 1, eco: 1, pre: 1, n: 'Mate + tostadas de pan francés con queso blanco y mermelada', it: [['pan', 60], ['quesoblanco', 40], ['mermelada', 15, 1], ['cafe', 250, 1]] },
    { id: 'cafe_tost_jq', fam: 'cafetost', s: 'dm', pop: 1, eco: 1, n: 'Café con leche + tostadas con jamón y queso', it: [['lechedesc', 200, 1], ['cafe', 100, 1], ['pan', 60], ['jamon', 40], ['quesomaquina', 20]] },
    { id: 'tostado_casero', fam: 'cafetost', s: 'dm', pop: 1, eco: 1, n: 'Tostado casero de jamón y queso + café con leche', it: [['panlactal', 50], ['jamon', 40], ['quesomaquina', 20], ['lechedesc', 200, 1], ['cafe', 100, 1]] },
    { id: 'licuado_banana_tost', s: 'dm', pop: 1, eco: 1, pre: 1, n: 'Licuado de banana con leche + tostada con queso blanco', it: [['lechedesc', 250], ['banana', 120], ['pan', 40], ['quesoblanco', 40]] },
    { id: 'huevos_tost', s: 'dm', pop: 1, eco: 1, n: 'Huevos revueltos con tostadas + una fruta', it: [['huevo', 100], ['pan', 60], ['naranja', 150]] },
    { id: 'avena_leche', s: 'dm', pop: 1, eco: 1, pre: 1, n: 'Avena con leche, banana y canela', it: [['lechedesc', 250], ['avena', 40], ['banana', 60]] },
    { id: 'yogbeb_cereal', s: 'dm', pop: 1, pre: 1, n: 'Yogur (mejor alto en proteína) con copos de maíz y banana', it: [['yogprot', 250], ['cereal', 30], ['banana', 120]] },
    { id: 'mate_galletas_qyd', s: 'dm', pop: 1, eco: 1, n: 'Mate + galletitas de agua con queso cremoso y dulce de membrillo', it: [['cafe', 250, 1], ['galletas', 30], ['quesocremoso', 30], ['membrillo', 20, 1]] },
    { id: 'tost_mm_palta', s: 'dm', n: 'Tostadas de masa madre con palta y huevo', it: [['panmm', 80], ['palta', 50], ['huevo', 100]] },
    { id: 'yog_rojos_nueces', s: 'dm', pre: 1, n: 'Yogur griego con frutos rojos, nueces y miel', it: [['yogriego', 200], ['frutosrojos', 100], ['nueces', 15], ['miel', 7, 1]] },
    { id: 'cafe_tostado', fam: 'cafetost', s: 'dm', buy: 1, n: 'Cafetería: café con leche + tostado de jamón y queso', it: [['lechedesc', 250, 1], ['cafe', 100, 1], ['tostado', 130]] },
    { id: 'miga_yog', s: 'dm', buy: 1, pop: 1, n: 'Sándwiches de miga de jamón y queso + yogur bebible', it: [['sandmiga', 100], ['yogbebible', 200]] },
    { id: 'yog_granola', s: 'dm', buy: 1, pre: 1, n: 'Yogur griego con granola y manzana', it: [['yogriego', 170], ['granola', 30], ['manzana', 150]] },
    { id: 'kiosco_yog', s: 'dm', buy: 1, pre: 1, n: 'Kiosco o súper: yogur proteico + banana + barrita', it: [['yogprot', 160], ['banana', 120], ['barracereal', 23]] },

    // Almuerzos / cenas — comida casera argentina
    { id: 'fideos_tuco', s: 'ac', pop: 1, eco: 1, n: 'Fideos con tuco y carne picada', it: [['fideos', 200], ['picada', 120], ['tomate', 150, 1], ['cebolla', 50, 1], ['rallado', 5]] },
    { id: 'arroz_pollo', s: 'ac', pop: 1, eco: 1, n: 'Arroz con pollo y verduras', it: [['arroz', 180], ['muslo', 130], ['morron', 50, 1], ['cebolla', 50, 1], ['arvejas', 40], ['aceite', 5]] },
    { id: 'guiso_lentejas', s: 'ac', pop: 1, eco: 1, n: 'Guiso de lentejas con carne y verduras', it: [['lentejas', 200], ['carne', 80], ['papa', 100], ['zanahoria', 60, 1], ['cebolla', 50, 1], ['aceite', 5]] },
    { id: 'pollo_horno', s: 'ac', pop: 1, eco: 1, n: 'Pollo al horno con papas y batatas', it: [['muslo', 150], ['papa', 150], ['batata', 100], ['cebolla', 50, 1], ['aceite', 5]] },
    { id: 'bife_pure', s: 'ac', pop: 1, n: 'Bife a la plancha con puré y ensalada', it: [['carne', 150], ['pure', 200], ['ensalada', 60, 1], ['tomate', 100, 1], ['aceite', 5]] },
    { id: 'mila_carne_pure', s: 'ac', pop: 1, n: 'Milanesa de carne al horno con puré y ensalada', it: [['milacarne', 130], ['pure', 200], ['ensalada', 60, 1]] },
    { id: 'suprema_ens', s: 'ac', pop: 1, n: 'Suprema a la plancha con ensalada mixta y pan', it: [['pollo', 160], ['ensalada', 80, 1], ['tomate', 120, 1], ['cebolla', 30, 1], ['pan', 60], ['aceite', 10]] },
    { id: 'tortilla_ens', s: 'ac', pop: 1, eco: 1, n: 'Tortilla de papas + ensalada mixta', it: [['tortillapapa', 250], ['ensalada', 80, 1], ['tomate', 100, 1], ['cebolla', 30, 1]] },
    { id: 'zapallitos_rell', s: 'ac', pop: 1, n: 'Zapallitos rellenos de carne y arroz', it: [['zapallito', 250, 1], ['picada', 100], ['arroz', 100], ['rallado', 5], ['tomate', 80, 1]] },
    { id: 'pastel_papas', s: 'ac', pop: 1, n: 'Pastel de papas + ensalada', it: [['pastelpapa', 350], ['ensalada', 60, 1]] },
    { id: 'tarta_verdura', s: 'ac', pop: 1, n: 'Tarta de verdura + ensalada', it: [['tartaverdura', 225], ['ensalada', 80, 1], ['tomate', 100, 1]] },
    { id: 'nioquis_tuco', s: 'ac', pop: 1, n: 'Ñoquis con tuco y carne picada', it: [['nioquis', 250], ['picada', 80], ['tomate', 120, 1], ['rallado', 5]] },
    { id: 'ravioles_fileto', s: 'ac', pop: 1, n: 'Ravioles con salsa fileto y queso rallado', it: [['ravioles', 250], ['tomate', 120, 1], ['rallado', 5]] },
    { id: 'hamb_casera', s: 'ac', pop: 1, n: 'Hamburguesas caseras al plato con papas al horno y ensalada', it: [['hambcasera', 150], ['papa', 200], ['ensalada', 80, 1], ['tomate', 100, 1]] },
    { id: 'arroz_atun', s: 'ac', pop: 1, eco: 1, n: 'Arroz con atún, huevo y arvejas', it: [['arroz', 180], ['atun', 100], ['huevo', 50], ['arvejas', 50], ['aceite', 5]] },
    { id: 'puchero', s: 'ac', pop: 1, eco: 1, n: 'Puchero (carne, papa, choclo, zapallo y zanahoria)', it: [['carne', 130], ['papa', 150], ['choclo', 80], ['calabaza', 100, 1], ['zanahoria', 60, 1]] },
    { id: 'locro_c', s: 'ac', pop: 1, n: 'Locro (ideal en invierno)', it: [['locro', 350]] },
    { id: 'milasoja_pure', s: 'ac', pop: 1, n: 'Milanesas de soja al horno con puré y ensalada', it: [['milasoja', 160], ['pure', 150], ['ensalada', 80, 1]] },
    { id: 'medallones_pure', s: 'ac', pop: 1, n: 'Medallones de merluza al horno con puré de papa y calabaza', it: [['medmerluza', 150], ['pure', 150], ['calabaza', 100, 1]] },
    { id: 'asado_ens', s: 'ac', pop: 1, lo: 1, n: 'Asado: vacío con ensalada mixta y pan', it: [['asado', 200], ['ensalada', 100, 1], ['tomate', 100, 1], ['cebolla', 30, 1], ['pan', 40]] },
    { id: 'langostinos_wok', s: 'ac', n: 'Langostinos salteados con arroz y verduras', it: [['langostinos', 150], ['arroz', 150], ['mixveg', 150, 1], ['aceite', 10]] },

    // Almuerzos / cenas — para cocinar
    { id: 'pollo_arroz', s: 'ac', pop: 1, n: 'Suprema a la plancha con arroz y ensalada', it: [['pollo', 150], ['arroz', 150], ['ensalada', 80, 1], ['tomate', 120, 1], ['aceite', 10]] },
    { id: 'carne_papa', s: 'ac', n: 'Carne magra con papas al horno y verduras', it: [['carne', 150], ['papa', 200], ['mixveg', 150, 1], ['aceite', 5]] },
    { id: 'pescado_pure', s: 'ac', n: 'Merluza al horno con papa y calabaza', it: [['merluza', 200], ['papa', 150], ['calabaza', 150, 1], ['ensalada', 60, 1], ['aceite', 10]] },
    { id: 'salmon_quinoa', s: 'ac', n: 'Salmón con quinoa y brócoli', it: [['salmon', 130], ['quinoa', 150], ['brocoli', 150, 1], ['aceite', 0]] },
    { id: 'bolognesa', s: 'ac', n: 'Fideos integrales con salsa bolognesa', it: [['fideosint', 200], ['picada', 120], ['tomate', 120, 1], ['morron', 50, 1], ['rallado', 5]] },
    { id: 'wok_cerdo', s: 'ac', n: 'Wok de cerdo con vegetales y arroz', it: [['cerdo', 150], ['arroz', 150], ['mixveg', 200, 1], ['aceite', 10]] },
    { id: 'wok_pollo', s: 'ac', n: 'Salteado de pollo, verduras y fideos', it: [['pollo', 150], ['fideos', 150], ['mixveg', 150, 1], ['aceite', 10]] },
    { id: 'omelette', s: 'ac', n: 'Omelette con verduras, pan integral y ensalada', it: [['huevo', 100], ['clara', 99], ['panint', 56], ['espinaca', 100, 1], ['champi', 60, 1], ['ensalada', 60, 1], ['aceite', 5]] },
    { id: 'batata_pollo', s: 'ac', n: 'Muslo de pollo al horno con batatas y chauchas', it: [['muslo', 150], ['batata', 200], ['chauchas', 120, 1]] },
    { id: 'mila_ens', s: 'ac', n: 'Milanesa de pollo al horno con papa y ensalada', it: [['milapollo', 120], ['papa', 150], ['ensalada', 80, 1], ['tomate', 100, 1], ['aceite', 5]] },
    { id: 'garbanzo_huevo', s: 'ac', n: 'Ensalada tibia de garbanzos, huevo y verduras', it: [['garbanzos', 165], ['huevo', 100], ['ensalada', 60, 1], ['tomate', 100, 1], ['zanahoria', 60, 1], ['aceite', 10]] },
    { id: 'lentejas_guiso', s: 'ac', n: 'Guiso de lentejas con arroz y verduras', it: [['lentejas', 250], ['arroz', 100], ['tvp', 20], ['zanahoria', 80, 1], ['calabaza', 100, 1], ['aceite', 5]] },
    { id: 'tofu_wok', s: 'ac', n: 'Tofu salteado con arroz integral y verduras', it: [['tofu', 200], ['arrozint', 150], ['mixveg', 200, 1], ['aceite', 5]] },
    { id: 'tempeh_bowl', s: 'ac', n: 'Bowl de tempeh, quinoa, verduras y palta', it: [['tempeh', 120], ['quinoa', 150], ['mixveg', 150, 1], ['palta', 40]] },
    { id: 'seitan_papa', s: 'ac', n: 'Seitán a la plancha con papas y ensalada', it: [['seitan', 150], ['papa', 200], ['ensalada', 80, 1], ['tomate', 100, 1], ['aceite', 10]] },
    { id: 'porotos_bowl', s: 'ac', n: 'Bowl de porotos, arroz, choclo y palta', it: [['porotos', 170], ['arroz', 120], ['choclo', 60], ['tomate', 100, 1], ['palta', 40]] },
    { id: 'polenta_carne', s: 'ac', n: 'Polenta con carne picada en salsa y queso', it: [['polenta', 250], ['picada', 120], ['tomate', 120, 1], ['rallado', 5]] },

    // Almuerzos / cenas — solo armar (sin cocinar)
    { id: 'ens_atun', s: 'ac', n: 'Ensalada completa de atún, choclo y pan integral', it: [['atun', 120], ['choclo', 100], ['panint', 28], ['ensalada', 80, 1], ['tomate', 120, 1], ['zanahoria', 60, 1], ['aceite', 10]] },
    { id: 'sand_pavo', s: 'ac', n: 'Sándwich integral de pavo, queso y vegetales', it: [['panint', 84], ['pavo', 80], ['quesofresco', 30], ['tomate', 80, 1], ['ensalada', 30, 1], ['palta', 40]] },
    { id: 'wrap_jamon', s: 'ac', n: 'Wraps de jamón, queso y vegetales', it: [['rapidita', 80], ['jamon', 60], ['quesofresco', 30], ['tomate', 80, 1], ['ensalada', 40, 1], ['palta', 30]] },
    { id: 'tofu_ens', s: 'ac', n: 'Ensalada de tofu y garbanzos', it: [['tofu', 150], ['garbanzos', 120], ['ensalada', 80, 1], ['tomate', 100, 1], ['aceite', 10]] },
    { id: 'ens_huevo_papa', s: 'ac', n: 'Ensalada de papa, huevo duro y atún', it: [['papa', 200], ['huevo', 100], ['atun', 60], ['ensalada', 60, 1], ['tomate', 100, 1], ['aceite', 5]] },
    { id: 'wrap_hummus', s: 'ac', n: 'Wraps de hummus, tofu y vegetales', it: [['rapidita', 80], ['tofu', 120], ['hummus', 45], ['tomate', 80, 1], ['ensalada', 40, 1]] },
    { id: 'ens_lentejas', s: 'ac', n: 'Ensalada de lentejas, choclo, tomate y palta', it: [['lentejas', 220], ['choclo', 80], ['tofu', 80], ['tomate', 120, 1], ['ensalada', 60, 1], ['palta', 40]] },
    { id: 'sand_jyq_fruta', s: 'ac', pop: 1, eco: 1, n: 'Sándwich de pan francés con jamón, queso y tomate + fruta', it: [['pan', 80], ['jamon', 60], ['quesomaquina', 20], ['tomate', 60, 1], ['ensalada', 20, 1], ['manzana', 180]] },
    { id: 'sand_pollo_rot', s: 'ac', pop: 1, n: 'Sándwich de pollo de rotisería con lechuga, tomate y mayonesa light', it: [['pan', 80], ['pollorot', 100], ['tomate', 60, 1], ['ensalada', 30, 1], ['mayolight', 10]] },
    { id: 'ens_caballa', s: 'ac', eco: 1, n: 'Ensalada de caballa, choclo y tomate con pan', it: [['caballa', 120], ['choclo', 100], ['tomate', 120, 1], ['ensalada', 60, 1], ['pan', 40], ['aceite', 5]] },
    { id: 'wrap_pollo', s: 'ac', n: 'Wraps de pollo de rotisería con vegetales y palta', it: [['rapidita', 80], ['pollorot', 130], ['tomate', 80, 1], ['ensalada', 40, 1], ['palta', 30]] },
    { id: 'sand_pavo_palta', s: 'ac', n: 'Sándwich integral de pavo, palta y vegetales', it: [['panint', 84], ['pavo', 100], ['palta', 40], ['tomate', 80, 1], ['ensalada', 30, 1]] },
    { id: 'ens_pollo', s: 'ac', n: 'Ensalada completa de pollo de rotisería, choclo y pan', it: [['pollorot', 150], ['choclo', 100], ['panint', 28], ['ensalada', 80, 1], ['tomate', 100, 1], ['zanahoria', 60, 1], ['aceite', 5]] },
    { id: 'sand_tofu', s: 'ac', n: 'Sándwich integral de tofu, palta y tomate', it: [['panint', 84], ['tofu', 150], ['palta', 40], ['tomate', 80, 1], ['ensalada', 30, 1]] },

    // Almuerzos / cenas — se compran hechos (lo = opción ocasional, menor prioridad)
    { id: 'rotiseria', s: 'ac', buy: 1, n: 'Rotisería: pollo al spiedo sin piel + papa + ensalada', it: [['pollorot', 180], ['papa', 150], ['ensalada', 100, 1], ['tomate', 100, 1]] },
    { id: 'super_atun', s: 'ac', buy: 1, n: 'Súper: atún + pan integral + tomate + fruta', it: [['atun', 120], ['panint', 56], ['tomate', 120, 1], ['banana', 120]] },
    { id: 'menu_bife', s: 'ac', buy: 1, pop: 1, n: 'Menú del día: bife o pollo a la plancha con ensalada (sin papas fritas)', it: [['carne', 180], ['ensalada', 100, 1], ['tomate', 100, 1], ['pan', 40]] },
    { id: 'tarta_rot', s: 'ac', buy: 1, pop: 1, n: 'Rotisería: porción de tarta de jamón y queso + ensalada', it: [['tartajyq', 150], ['ensalada', 100, 1], ['tomate', 100, 1]] },
    { id: 'sand_mila_c', s: 'ac', buy: 1, pop: 1, lo: 1, n: 'Sándwich de milanesa con lechuga y tomate', it: [['sandmila', 280]] },
    { id: 'poke', s: 'ac', buy: 1, n: 'Delivery: poke bowl de salmón, arroz, palta y pepino', it: [['salmon', 120], ['arroz', 150], ['palta', 40], ['pepino', 60, 1]] },
    { id: 'emp_ens', s: 'ac', buy: 1, n: 'Empanadas de pollo al horno + ensalada', it: [['emppollo', 180], ['ensalada', 100, 1], ['tomate', 100, 1]] },
    { id: 'empv_ens', s: 'ac', buy: 1, lo: 1, n: 'Empanadas de verdura al horno + ensalada', it: [['empverdura', 180], ['ensalada', 100, 1], ['tomate', 100, 1]] },
    { id: 'sushi_c', s: 'ac', buy: 1, n: 'Sushi + ensalada', it: [['sushi', 240], ['ensalada', 80, 1]] },
    { id: 'burger_ens', s: 'ac', buy: 1, lo: 1, n: 'Hamburguesa simple + ensalada (sin papas fritas)', it: [['hamburguesa', 120], ['ensalada', 100, 1], ['tomate', 80, 1]] },
    { id: 'pizza_ens', s: 'ac', buy: 1, lo: 1, n: 'Pizza de muzzarella + ensalada', it: [['pizza', 240], ['ensalada', 100, 1], ['tomate', 100, 1]] },
    { id: 'tostado_ens', s: 'ac', buy: 1, lo: 1, n: 'Tostado de jamón y queso + ensalada + fruta', it: [['tostado', 130], ['ensalada', 80, 1], ['manzana', 180]] },

    // Colaciones
    { id: 'yog_fruta', s: 'sn', pre: 1, buy: 1, n: 'Yogur proteico con fruta', it: [['yogprot', 160], ['manzana', 180]] },
    { id: 'fruta_fs', s: 'sn', buy: 1, n: 'Fruta + puñado de almendras', it: [['banana', 120], ['almendras', 20]] },
    { id: 'fruta_mani', s: 'sn', buy: 1, n: 'Fruta + maní sin sal', it: [['mandarina', 180], ['mani', 20]] },
    { id: 'tost_pavo', s: 'sn', n: 'Tostadas de arroz con queso y pavo', it: [['tostarroz', 27], ['quesofresco', 30], ['pavo', 40]] },
    { id: 'batido', s: 'sn', pre: 1, n: 'Batido de proteína con fruta', it: [['whey', 30], ['lechedesc', 250], ['banana', 60]] },
    { id: 'barra_fruta', s: 'sn', pre: 1, buy: 1, n: 'Barrita proteica + fruta', it: [['barraprot', 45], ['mandarina', 90]] },
    { id: 'cottage_rojos', s: 'sn', n: 'Queso cottage con frutos rojos', it: [['cottage', 150], ['frutosrojos', 100]] },
    { id: 'huevos_fruta', s: 'sn', n: 'Huevos duros + fruta', it: [['huevo', 100], ['naranja', 150]] },
    { id: 'hummus_zan', s: 'sn', n: 'Hummus con bastones de zanahoria y tostadas de arroz', it: [['hummus', 60], ['zanahoria', 80, 1], ['tostarroz', 18]] },
    { id: 'soja_banana', s: 'sn', pre: 1, n: 'Bebida de soja + banana + maní', it: [['bebsoja', 250], ['banana', 120], ['mani', 15]] },
    { id: 'yogdl_fruta', s: 'sn', pre: 1, n: 'Yogur deslactosado con fruta y almendras', it: [['yogdeslac', 190], ['frutillas', 150], ['almendras', 10]] },
    { id: 'mate_banana', s: 'sn', pop: 1, eco: 1, pre: 1, buy: 1, n: 'Mate + banana', it: [['cafe', 250, 1], ['banana', 120]] },
    { id: 'yogbeb_fruta', s: 'sn', pop: 1, pre: 1, buy: 1, n: 'Yogur bebible + mandarina', it: [['yogbebible', 200], ['mandarina', 90]] },
    { id: 'queso_dulce', s: 'sn', pop: 1, eco: 1, n: 'Queso y dulce (porción chica)', it: [['quesocremoso', 30], ['membrillo', 20]] },
    { id: 'galletas_qb', s: 'sn', n: 'Galletas de arroz con queso blanco y tomate', it: [['tostarroz', 27], ['quesoblanco', 60], ['tomate', 60, 1]] },
    { id: 'licuado_frutilla', s: 'sn', pop: 1, pre: 1, n: 'Licuado de frutilla con leche', it: [['lechedesc', 250], ['frutillas', 150]] },
    { id: 'mate_pan_queso', s: 'sn', pop: 1, eco: 1, n: 'Mate + medio mignon con queso de máquina', it: [['cafe', 250, 1], ['pan', 40], ['quesomaquina', 20]] },
    { id: 'pan_jamon', s: 'sn', pre: 1, n: 'Pan con jamón + banana', it: [['pan', 60], ['jamon', 40], ['banana', 120]] },
  ];

  // Comidas modelo anteriores que también son de todos los días (pop) o económicas (eco)
  const flag = (k, ids) => ids.forEach(id => { const c = NG.COMBOS.find(x => x.id === id); if (c) c[k] = 1; });
  flag('pop', ['carne_papa', 'pescado_pure', 'bolognesa', 'mila_ens', 'polenta_carne', 'lentejas_guiso', 'omelette', 'emp_ens', 'empv_ens', 'rotiseria', 'pizza_ens', 'tost_jyq', 'licuado', 'cafe_tostado', 'kiosco_yog', 'huevos_fruta', 'fruta_mani', 'pan_jamon', 'yog_fruta', 'ens_atun']);
  flag('eco', ['polenta_carne', 'lentejas_guiso', 'omelette', 'garbanzo_huevo', 'porotos_bowl', 'huevos_fruta', 'fruta_mani', 'pan_jamon', 'ens_atun', 'ens_huevo_papa']);

  // Medidas caseras para quien nunca pesó la comida
  NG.MEASURES = [
    ['🍚', 'Arroz, fideos o puré (cocidos)', '1 taza ≈ 150 a 200 g · 1 cucharón ≈ 100 g · 1 plato hondo ≈ 250 g'],
    ['🥩', 'Carne, pollo o pescado', '1 bife o suprema chica ≈ 150 g: del tamaño y grosor de tu palma'],
    ['🍞', 'Pan', '1 mignon ≈ 40 g · 1 rebanada de pan lactal ≈ 25 g · 1 rebanada de integral ≈ 28 g'],
    ['🥚', 'Huevo', '1 huevo ≈ 50 g · 1 clara ≈ 33 g'],
    ['🧀', 'Queso', '1 feta ≈ 20 g · 1 porción de cremoso como una caja de fósforos ≈ 30 g · 1 cucharada de queso blanco ≈ 20 g'],
    ['🥛', 'Leche y yogur', '1 taza o vaso ≈ 200 ml · 1 pote de yogur ≈ 170 a 190 g'],
    ['🫒', 'Aceite', '1 cucharadita ≈ 5 g · 1 cucharada sopera ≈ 13 g (medilo, no lo tires a ojo)'],
    ['🌾', 'Avena y cereales', '1 cucharada sopera colmada ≈ 10 g · ½ taza ≈ 40 g'],
    ['🥑', 'Palta', '¼ de palta mediana ≈ 40 g'],
    ['🍌', 'Frutas', '1 banana ≈ 120 g · 1 manzana ≈ 180 g · 1 naranja ≈ 150 g · 1 mandarina ≈ 90 g'],
    ['🥗', 'Verduras', 'Libres: con que ocupen la mitad del plato, alcanza'],
  ];

  // Texto guía para opciones "Comer afuera"
  NG.FLEX = {
    dm: 'Café con leche + tostado de jamón y queso.\nO yogur proteico + fruta + barrita.\nMedialunas, solo de vez en cuando.',
    ac: 'Proteína a la plancha o al horno + ensalada + una porción chica de papa, arroz o pan.\nSalsas aparte. Agua, soda o bebida zero.',
    sn: 'Fruta y yogur, frutos secos, barrita proteica o un sándwich chico.',
  };

  // Opciones del formulario y del perfil
  NG.GOALS = {
    perder: { n: 'Perder grasa', e: '🔥' },
    recomp: { n: 'Recomposición corporal', e: '⚖️', d: 'Bajar grasa y ganar músculo a la vez' },
    mantener: { n: 'Salud y mantenimiento', e: '💚' },
    ganar: { n: 'Ganar masa muscular', e: '💪' },
    rend: { n: 'Rendimiento deportivo', e: '🏃' },
  };
  NG.RATES = {
    perder: { suave: 'Suave (~0,5% del peso/semana)', moderado: 'Moderado (~0,75%/semana)', rapido: 'Rápido (~1%/semana)' },
    ganar: { suave: 'Muy limpio (+5% kcal)', moderado: 'Limpio (+10% kcal)', rapido: 'Rápido (+15% kcal)' },
  };
  NG.ACTIVITY = {
    sed: { n: 'Sedentario', d: 'Trabajo sentado, menos de 5.000 pasos por día' },
    lig: { n: 'Poco activo', d: '5.000 a 7.500 pasos, algo de tiempo de pie' },
    act: { n: 'Activo', d: '7.500 a 10.000 pasos o trabajo de pie' },
    muy: { n: 'Muy activo', d: 'Más de 10.000 pasos o trabajo físico' },
  };
  NG.TRAIN = {
    fuerza: 'Fuerza / pesas',
    hiit: 'Funcional / HIIT / crossfit',
    cardio: 'Cardio (correr, bici, natación)',
    deporte: 'Deporte (fútbol, tenis, pádel…)',
    suave: 'Yoga / pilates / caminata',
  };
  NG.TRAIN_TIME = {
    manana: { n: 'Mañana (6 a 10 h)', h: 8 },
    mediodia: { n: 'Mediodía (11 a 14 h)', h: 12.5 },
    tarde: { n: 'Tarde (15 a 19 h)', h: 18 },
    noche: { n: 'Noche (19 a 23 h)', h: 20.5 },
    var: { n: 'Varía', h: null },
  };
  NG.COOKING = {
    cocina: 'Sí, puedo cocinar',
    basico: 'Solo cosas simples (armar, microondas)',
    nada: 'No cocino: compro o como afuera',
  };
  NG.BUDGET = { bajo: 'Ajustado', medio: 'Medio', alto: 'Holgado' };
  // Datos de entrenamiento del alta (reemplazan al formulario de bienvenida y la ficha de Google)
  NG.PLAN_TYPES = { online: 'Online', presencial: 'Presencial', hibrido: 'Híbrido' };
  NG.EXPERIENCE = { cero: 'Nunca entrené', m6: 'Menos de 6 meses', a1: '6 a 12 meses', a3: '1 a 3 años', mas: 'Más de 3 años' };
  NG.EQUIPMENT = { gym: 'Gimnasio completo', barrio: 'Gimnasio de barrio o básico', casa: 'En casa o calistenia', otro: 'Otro' };
  NG.ALCOHOL = { nunca: 'No tomo', ocasional: 'Ocasional (eventos)', semanal: 'Fines de semana', frecuente: 'Varias veces por semana' };

  // Condiciones de salud: lv = nivel de alerta para el entrenador
  NG.MED = [
    { id: 'embarazo', n: 'Embarazo o lactancia', lv: 'bad', w: 'Embarazo o lactancia: no aplicar déficit calórico. Trabajar con médico y nutricionista matriculado.' },
    { id: 'tca', n: 'Trastorno de la conducta alimentaria (actual o pasado)', lv: 'bad', w: 'Antecedente de TCA: derivar a profesional de salud mental y nutricionista. Evitar conteos estrictos y pesajes frecuentes.' },
    { id: 'diabetes', n: 'Diabetes o prediabetes', lv: 'bad', w: 'Diabetes: requiere supervisión médica, sobre todo si usa insulina u otra medicación (riesgo de hipoglucemia).' },
    { id: 'renal', n: 'Enfermedad renal', lv: 'bad', w: 'Enfermedad renal: no indicar proteína alta ni creatina sin aval del nefrólogo.' },
    { id: 'bariatrica', n: 'Cirugía bariátrica', lv: 'bad', w: 'Cirugía bariátrica: el plan debe coordinarse con el equipo tratante.' },
    { id: 'cardio', n: 'Hipertensión o enfermedad cardiovascular', lv: 'warn', w: 'Hipertensión / cardiovascular: moderar sodio y coordinar con su médico.' },
    { id: 'hepatica', n: 'Enfermedad hepática', lv: 'warn', w: 'Enfermedad hepática: requiere aval médico.' },
    { id: 'glp1', n: 'Medicación para bajar de peso (semaglutida, tirzepatida, etc.)', lv: 'warn', w: 'Medicación GLP-1: priorizar proteína y entrenamiento de fuerza, porciones chicas e hidratación; coordinar con su médico.' },
    { id: 'tiroides', n: 'Hipo o hipertiroidismo', lv: 'warn', w: 'Tiroides: el gasto puede variar; ajustar según la evolución y su tratamiento.' },
    { id: 'celiaquia', n: 'Celiaquía', lv: 'warn', w: 'Celiaquía: solo productos sin TACC certificados (se excluye el gluten del plan).' },
    { id: 'digestivo', n: 'Problemas digestivos (colon irritable, reflujo…)', lv: 'info', w: 'Problemas digestivos: aumentar la fibra de a poco y observar tolerancia individual.' },
    { id: 'medicacion', n: 'Tomo otra medicación de forma habitual', lv: 'info', w: 'Toma medicación habitual: verificar interacciones con su médico antes de sumar suplementos.' },
  ];

  /* Guía para comer afuera — contenido para el alumno */

  NG.PLACES = [
    {
      e: '🍽️', t: 'Restaurante, bodegón o menú ejecutivo',
      best: ['Carne, pollo o pescado a la plancha, al horno o grillados', 'Guarnición de ensalada o verduras', 'Arroz, papa o puré', 'Agua, soda o lo que prefieras'],
    },
    {
      e: '🔥', t: 'Parrilla y asado',
      best: ['Cortes magros: lomo, colita de cuadril, peceto, bola de lomo, pollo sin piel', 'Ensaladas variadas y verduras a la parrilla', 'Provoleta para compartir'],
    },
    {
      e: '🍔', t: 'Comida rápida y hamburgueserías',
      best: ['Hamburguesa o de pollo grillado', 'Wraps o ensaladas con pollo', 'Papas o ensalada'],
    },
    {
      e: '🍕', t: 'Pizzería y empanadas',
      best: ['Porciones de pizza o empanadas al horno + ensalada', 'Pizza de muzzarella, napolitana o con verduras', 'Empanadas de pollo, carne o verdura al horno'],
    },
    {
      e: '🏪', t: 'Kiosco, estación de servicio o súper',
      best: ['Yogur (mejor si es alto en proteína)', 'Fruta', 'Puñado de frutos secos o maní sin sal', 'Barrita proteica', 'Sándwich de miga o tostado de jamón y queso', 'En el súper: atún en lata + pan + tomate'],
    },
    {
      e: '☕', t: 'Cafetería',
      best: ['Café con leche, cortado o capuchino', 'Tostado de jamón y queso, o tostadas con queso', 'Yogur con frutas o licuado de fruta con leche sin azúcar'],
    },
    {
      e: '💼', t: 'Comedor del trabajo o viandas',
      best: ['Plato con proteína, verduras y algo de carbohidrato', 'Elegí la opción con proteína visible: pollo, carne, pescado, huevo o legumbres', 'Si solo hay pastas o guiso: sumá una ensalada'],
    },
    {
      e: '🛵', t: 'Delivery',
      best: ['Wok de pollo o carne con verduras y arroz', 'Sushi, mejor con sashimi', 'Bowls o ensaladas con proteína', 'Pollo al spiedo sin piel + ensalada'],
    },
    {
      e: '🎉', t: 'Cumpleaños, eventos y salidas',
      best: ['Lo que más te guste de la mesa', 'Algo con proteína antes de ir, si te queda cómodo'],
    },
    {
      e: '✈️', t: 'Viajes',
      best: ['Llevá snacks: fruta, frutos secos, barritas, tostadas de arroz', 'En el súper: yogur, fruta, atún, pan integral, queso', 'Desayuno de hotel: huevos, yogur, fruta y pan integral'],
    },
  ];

  /* Arranque por fases: primero hábitos, después porciones, después autonomía.
     goal = % de comidas cumplidas que se pide en esa fase. */
  NG.PHASES = [
    {
      e: '🌱', n: 'Base', w: 'semanas 1 y 2', goal: 70,
      focus: 'Armar la rutina: comer en tus horarios, proteína en cada comida y verduras. No hace falta ser perfecto.',
      habits: [['prot', '🍗', 'Comí proteína en cada comida'], ['hor', '⏰', 'Respeté mis horarios de comida'], ['veg', '🥦', 'Sumé verduras en almuerzo y cena']],
    },
    {
      e: '🎯', n: 'Plan completo', w: 'semanas 3 y 4', goal: 80,
      focus: 'Seguir las porciones del plan y rotar entre tus opciones. Ahora cada comida suma.',
      habits: [['porc', '⚖️', 'Respeté las porciones del plan'], ['veg', '🥦', 'Comí verduras en almuerzo y cena'], ['sueno', '😴', 'Dormí 7 horas o más']],
    },
    {
      e: '🚀', n: 'Autonomía', w: 'desde la semana 5', goal: 85,
      focus: 'Resolver cualquier situación (comer afuera, eventos, viajes) con las equivalencias y la guía de comer afuera.',
      habits: [['planif', '🗓️', 'Planifiqué mis comidas del día'], ['mov', '🚶', 'Me moví / hice mis pasos'], ['sueno', '😴', 'Dormí 7 horas o más']],
    },
  ];

  // Comida libre planificada: parte del plan, no un "me salí"
  NG.FREE_TIPS = [
    'Elegí el momento: una salida, un asado, un cumpleaños.',
    'Disfrutala sin culpa: es parte de tu plan.',
    'Volvé al plan en la comida siguiente, sin compensar ni saltear comidas.',
    'No se acumula: si no la usás, no pasa a la semana siguiente.',
  ];

  NG.LABELS = [
    'Menos sellos negros = mejor elección. Los sellos indican exceso de azúcares, grasas, sodio o calorías.',
    'Mirá la porción: muchos paquetes traen 2 o 3 porciones.',
    'Fijate cuánta proteína y fibra aporta: más es mejor.',
    'Los ingredientes van de mayor a menor cantidad: si el primero es azúcar, es una golosina.',
  ];

  NG.ALCOHOL_TIPS = [
    'El alcohol aporta 7 kcal por gramo y no te da saciedad. Una lata grande de cerveza o un trago pueden sumar 150 a 250 kcal.',
    'Empeora el descanso y la recuperación muscular.',
    'Si tomás: preferí vino o destilados con soda o bebida zero, en vez de tragos dulces.',
    'Alterná cada vaso con uno de agua y no tomes con el estómago vacío.',
  ];
})(window.NG);
