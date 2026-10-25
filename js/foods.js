/* Base de alimentos.
   Valores por 100 g (o 100 ml) en el estado indicado: carnes, cereales y legumbres COCIDOS.
   Fuentes de referencia: tablas de composición USDA / ARGENFOODS, redondeadas.
   Los productos marcados "aprox" (comidas compradas) varían según el comercio. */
window.NG = window.NG || {};
(function (NG) {
  // id, nombre, grupo, emoji, kcal, prot, carb, grasa, fibra,
  // dieta (0 vegano · 1 vegetariano · 2 pescetariano · 3 omnívoro),
  // cocción (0 listo · 1 armar/microondas · 2 cocinar),
  // alérgenos, unidad, g por unidad, mín g, máx g, paso g, flags (u = mostrar en unidades, ml = líquido, aprox, caro)
  const R = [
    // ── Proteínas
    ['pollo', 'Suprema / pechuga de pollo', 'prot', '🍗', 165, 31, 0, 3.6, 0, 3, 2, '', 'suprema', 180, 80, 300, 10],
    ['muslo', 'Pata muslo de pollo (sin piel)', 'prot', '🍗', 209, 26, 0, 10.9, 0, 3, 2, '', 'pata muslo', 120, 80, 300, 10],
    ['carne', 'Carne magra (bife de nalga, cuadril, peceto)', 'prot', '🥩', 170, 29, 0, 6, 0, 3, 2, '', 'bife', 150, 80, 300, 10],
    ['picada', 'Carne picada magra', 'prot', '🥩', 200, 27, 0, 10, 0, 3, 2, '', null, 0, 80, 250, 10],
    ['cerdo', 'Lomo de cerdo', 'prot', '🥩', 143, 26, 0, 3.5, 0, 3, 2, '', null, 0, 80, 300, 10],
    ['milapollo', 'Milanesa de pollo al horno', 'prot', '🍗', 210, 23, 12, 8, 0.8, 3, 2, 'g,h', 'milanesa', 120, 80, 300, 10, 'aprox'],
    ['atun', 'Atún al natural (escurrido)', 'prot', '🐟', 116, 25.5, 0, 0.8, 0, 2, 0, 'p', 'lata', 120, 60, 240, 10],
    ['merluza', 'Merluza / pescado blanco', 'prot', '🐟', 95, 20, 0, 1.5, 0, 2, 2, 'p', null, 0, 100, 350, 10],
    ['salmon', 'Salmón', 'prot', '🐟', 206, 22, 0, 12, 0, 2, 2, 'p', null, 0, 80, 250, 10, 'caro'],
    ['huevo', 'Huevo', 'prot', '🥚', 143, 12.6, 0.7, 9.5, 0, 1, 2, 'h', 'huevo', 50, 50, 200, 50, 'u'],
    ['clara', 'Clara de huevo', 'prot', '🥚', 52, 10.9, 0.7, 0.2, 0, 1, 2, 'h', 'clara', 33, 33, 264, 33, 'u'],
    ['jamon', 'Jamón cocido', 'prot', '🥓', 115, 18, 1.5, 4, 0, 3, 0, '', 'feta', 20, 20, 120, 20, 'u'],
    ['paleta', 'Paleta cocida (fiambre)', 'prot', '🥓', 130, 16, 2, 7, 0, 3, 0, '', 'feta', 20, 20, 120, 20, 'u,aprox'],
    ['milacarne', 'Milanesa de carne al horno', 'prot', '🥩', 230, 22, 13, 10, 0.8, 3, 2, 'g,h', 'milanesa', 120, 80, 300, 10, 'aprox'],
    ['milasoja', 'Milanesa de soja al horno', 'prot', '🌱', 215, 14, 22, 8, 4, 1, 2, 's,g', 'milanesa', 80, 80, 240, 40, 'u,aprox'],
    ['hambcasera', 'Hamburguesa casera de carne (a la plancha)', 'prot', '🍔', 230, 24, 1, 15, 0, 3, 2, '', 'medallón', 110, 80, 250, 10, 'aprox'],
    ['picadacomun', 'Carne picada común', 'prot', '🥩', 270, 25, 0, 19, 0, 3, 2, '', null, 0, 80, 250, 10],
    ['asado', 'Vacío o tira de asado', 'prot', '🔥', 300, 24, 0, 23, 0, 3, 2, '', 'porción', 200, 100, 300, 10, 'aprox'],
    ['caballa', 'Caballa en lata (al natural, escurrida)', 'prot', '🐟', 156, 23, 0, 6.5, 0, 2, 0, 'p', 'lata', 170, 60, 240, 10],
    ['medmerluza', 'Medallones o bastoncitos de merluza (al horno)', 'prot', '🐟', 190, 12, 18, 8, 1, 2, 2, 'p,g,h', 'medallón', 50, 50, 250, 25, 'aprox'],
    ['langostinos', 'Langostinos', 'prot', '🦐', 100, 22, 0, 1, 0, 2, 2, 'ma', null, 0, 80, 250, 10, 'caro'],
    ['pavo', 'Pechuga de pavo (fiambre)', 'prot', '🦃', 104, 17, 3, 2, 0, 3, 0, '', 'feta', 20, 20, 120, 20, 'u'],
    ['whey', 'Proteína en polvo (whey)', 'prot', '🥤', 380, 78, 8, 5, 0, 1, 0, 'l', 'scoop', 30, 15, 60, 15, 'u'],
    ['protveg', 'Proteína vegetal en polvo', 'prot', '🥤', 370, 75, 8, 6, 2, 0, 0, 's', 'scoop', 30, 15, 60, 15, 'u,caro'],
    ['tofu', 'Tofu firme', 'prot', '🧈', 144, 17.3, 2.8, 8.7, 2.3, 0, 1, 's', null, 0, 80, 300, 10],
    ['tempeh', 'Tempeh', 'prot', '🟫', 192, 20, 7.6, 10.8, 0, 0, 2, 's', null, 0, 60, 250, 10, 'caro'],
    ['seitan', 'Seitán', 'prot', '🍖', 140, 25, 6, 2, 0.6, 0, 1, 'g', null, 0, 60, 250, 10, 'aprox'],
    ['tvp', 'Soja texturizada (seca)', 'prot', '🫘', 330, 50, 31, 1.2, 18, 0, 2, 's', null, 0, 20, 100, 5],

    // ── Lácteos y bebidas vegetales
    ['yogriego', 'Yogur griego natural sin azúcar', 'lact', '🥣', 73, 9.9, 3.9, 1.9, 0, 1, 0, 'l', 'pote', 170, 100, 500, 10],
    ['yogprot', 'Yogur alto en proteína', 'lact', '🥛', 70, 9, 6.5, 0.6, 0, 1, 0, 'l', 'pote', 160, 100, 500, 10, 'aprox'],
    ['yogdeslac', 'Yogur descremado deslactosado', 'lact', '🥛', 56, 5.5, 7.5, 0.3, 0, 1, 0, '', 'pote', 190, 100, 500, 10, 'aprox'],
    ['yogdesc', 'Yogur descremado natural', 'lact', '🥛', 56, 5.7, 7.7, 0.2, 0, 1, 0, 'l', 'pote', 190, 100, 400, 10],
    ['lechedesc', 'Leche descremada', 'lact', '🥛', 34, 3.4, 5, 0.1, 0, 1, 0, 'l', 'taza', 200, 100, 500, 50, 'ml'],
    ['lechedeslac', 'Leche descremada deslactosada', 'lact', '🥛', 35, 3.4, 5, 0.1, 0, 1, 0, '', 'taza', 200, 100, 500, 50, 'ml'],
    ['lecheent', 'Leche entera', 'lact', '🥛', 61, 3.2, 4.8, 3.3, 0, 1, 0, 'l', 'taza', 200, 100, 500, 50, 'ml'],
    ['bebsoja', 'Bebida de soja sin azúcar', 'lact', '🥛', 33, 2.9, 1.7, 1.6, 0.5, 0, 0, 's', 'taza', 200, 100, 500, 50, 'ml'],
    ['bebalm', 'Bebida de almendras sin azúcar', 'lact', '🥛', 15, 0.6, 0.3, 1.2, 0.3, 0, 0, 'fs', 'taza', 200, 100, 500, 50, 'ml'],
    ['quesoblanco', 'Queso blanco descremado (untable)', 'lact', '🧀', 80, 11, 4, 2, 0, 1, 0, 'l', 'cda', 20, 20, 150, 10],
    ['quesomaquina', 'Queso de máquina (tipo tybo o dambo)', 'lact', '🧀', 320, 25, 1, 24, 0, 1, 0, 'l', 'feta', 20, 10, 80, 10, 'u'],
    ['quesocremoso', 'Queso cremoso', 'lact', '🧀', 290, 18, 2, 24, 0, 1, 0, 'l', 'porción', 30, 15, 90, 15],
    ['yogbebible', 'Yogur bebible descremado', 'lact', '🥛', 55, 3.3, 9, 0.3, 0, 1, 0, 'l', 'vaso', 200, 100, 400, 50, 'ml,aprox'],
    ['cottage', 'Queso cottage', 'lact', '🧀', 98, 11, 3.4, 4.3, 0, 1, 0, 'l', null, 0, 50, 300, 10],
    ['ricota', 'Ricota descremada', 'lact', '🧀', 110, 11, 4, 5, 0, 1, 0, 'l', null, 0, 30, 250, 10, 'aprox'],
    ['quesofresco', 'Queso light (port salut / cremoso)', 'lact', '🧀', 210, 20, 2, 13, 0, 1, 0, 'l', 'feta', 30, 15, 120, 15],

    // ── Cereales, panes y tubérculos
    ['arroz', 'Arroz blanco (cocido)', 'carb', '🍚', 130, 2.7, 28.2, 0.3, 0.4, 0, 2, '', 'taza', 160, 50, 450, 10],
    ['arrozint', 'Arroz integral (cocido)', 'carb', '🍚', 123, 2.7, 25.6, 1, 1.6, 0, 2, '', 'taza', 160, 50, 450, 10],
    ['fideos', 'Fideos (cocidos)', 'carb', '🍝', 158, 5.8, 30.9, 0.9, 1.8, 0, 2, 'g', 'taza', 140, 50, 450, 10],
    ['fideosint', 'Fideos integrales (cocidos)', 'carb', '🍝', 124, 5.3, 26.5, 0.5, 4.5, 0, 2, 'g', 'taza', 140, 50, 450, 10],
    ['papa', 'Papa (hervida o al horno)', 'carb', '🥔', 86, 1.7, 20, 0.1, 1.8, 0, 2, '', 'papa mediana', 150, 80, 500, 10],
    ['batata', 'Batata (al horno)', 'carb', '🍠', 90, 2, 20.7, 0.2, 3.3, 0, 2, '', 'batata chica', 130, 80, 450, 10],
    ['quinoa', 'Quinoa (cocida)', 'carb', '🍚', 120, 4.4, 21.3, 1.9, 2.8, 0, 2, '', 'taza', 185, 50, 350, 10, 'caro'],
    ['choclo', 'Choclo / maíz (cocido o en lata)', 'carb', '🌽', 96, 3.4, 21, 1.5, 2.4, 0, 1, '', 'taza', 150, 40, 300, 10],
    ['polenta', 'Polenta (cocida)', 'carb', '🍲', 74, 1.7, 16, 0.3, 0.8, 0, 2, '', null, 0, 100, 450, 10],
    ['avena', 'Avena en copos', 'carb', '🌾', 379, 13.2, 67.7, 6.5, 10.1, 0, 0, 'g', 'cda', 10, 15, 150, 5],
    ['panint', 'Pan integral de molde', 'carb', '🍞', 252, 12.4, 42.7, 3.5, 6, 0, 0, 'g', 'rebanada', 28, 28, 168, 28, 'u'],
    ['pan', 'Pan francés', 'carb', '🥖', 270, 9, 51, 3.2, 2.7, 0, 0, 'g', 'mignon', 40, 20, 200, 20, 'u'],
    ['panlactal', 'Pan lactal blanco', 'carb', '🍞', 265, 8, 49, 4, 2.5, 0, 0, 'g', 'rebanada', 25, 25, 150, 25, 'u'],
    ['panmm', 'Pan de masa madre', 'carb', '🍞', 250, 9, 48, 2, 3, 0, 0, 'g', 'rebanada', 40, 40, 160, 20, 'u,caro'],
    ['pure', 'Puré de papa (con leche)', 'carb', '🥔', 95, 2, 15, 3, 1.3, 1, 2, 'l', 'taza', 200, 80, 450, 10],
    ['nioquis', 'Ñoquis de papa (cocidos)', 'carb', '🍝', 133, 3.5, 28, 0.6, 1.5, 1, 2, 'g,h', 'plato', 250, 100, 400, 10, 'aprox'],
    ['ravioles', 'Ravioles de ricota o verdura (cocidos)', 'carb', '🥟', 170, 7, 25, 5, 1.5, 1, 2, 'g,h,l', 'plato', 250, 100, 400, 10, 'aprox'],
    ['tostarroz', 'Tostadas / galletas de arroz', 'carb', '🍘', 387, 8, 81.5, 2.8, 4.2, 0, 0, '', 'unidad', 9, 18, 72, 9, 'u'],
    ['galletas', 'Galletitas de agua', 'carb', '🍪', 420, 10, 70, 11, 3, 0, 0, 'g', 'unidad', 6, 18, 72, 6, 'u,aprox'],
    ['rapidita', 'Tortilla de trigo (rapidita)', 'carb', '🌯', 310, 8, 52, 8, 2.5, 0, 0, 'g', 'unidad', 40, 40, 160, 40, 'u'],
    ['cereal', 'Copos de maíz sin azúcar', 'carb', '🥣', 357, 7.5, 84, 0.4, 3, 0, 0, 'g', 'taza', 30, 15, 90, 5],
    ['granola', 'Granola sin azúcar agregada', 'carb', '🥣', 450, 10, 62, 17, 7, 0, 0, 'g,fs', 'cda', 12, 15, 80, 5, 'aprox'],

    // ── Legumbres
    ['lentejas', 'Lentejas (cocidas)', 'leg', '🫘', 116, 9, 20.1, 0.4, 7.9, 0, 1, '', 'taza', 200, 80, 350, 10],
    ['garbanzos', 'Garbanzos (cocidos)', 'leg', '🫘', 164, 8.9, 27.4, 2.6, 7.6, 0, 1, '', 'taza', 165, 80, 350, 10],
    ['porotos', 'Porotos (cocidos)', 'leg', '🫘', 132, 8.9, 23.7, 0.5, 8.7, 0, 1, '', 'taza', 170, 80, 350, 10],
    ['arvejas', 'Arvejas (en lata, escurridas)', 'leg', '🫛', 69, 4.5, 12, 0.4, 4, 0, 1, '', 'taza', 160, 30, 250, 10],
    ['hummus', 'Hummus', 'leg', '🥙', 166, 7.9, 14.3, 9.6, 6, 0, 0, '', 'cda', 15, 15, 120, 15],

    // ── Frutas
    ['banana', 'Banana', 'fruta', '🍌', 89, 1.1, 22.8, 0.3, 2.6, 0, 0, '', 'banana', 120, 60, 240, 60, 'u'],
    ['manzana', 'Manzana', 'fruta', '🍎', 52, 0.3, 13.8, 0.2, 2.4, 0, 0, '', 'manzana', 180, 90, 360, 90, 'u'],
    ['naranja', 'Naranja', 'fruta', '🍊', 47, 0.9, 11.8, 0.1, 2.4, 0, 0, '', 'naranja', 150, 75, 300, 75, 'u'],
    ['mandarina', 'Mandarina', 'fruta', '🍊', 53, 0.8, 13.3, 0.3, 1.8, 0, 0, '', 'mandarina', 90, 90, 270, 90, 'u'],
    ['pera', 'Pera', 'fruta', '🍐', 57, 0.4, 15.2, 0.1, 3.1, 0, 0, '', 'pera', 170, 85, 340, 85, 'u'],
    ['kiwi', 'Kiwi', 'fruta', '🥝', 61, 1.1, 14.7, 0.5, 3, 0, 0, '', 'kiwi', 75, 75, 225, 75, 'u'],
    ['durazno', 'Durazno', 'fruta', '🍑', 39, 0.9, 9.5, 0.3, 1.5, 0, 0, '', 'durazno', 150, 75, 300, 75, 'u'],
    ['frutillas', 'Frutillas', 'fruta', '🍓', 32, 0.7, 7.7, 0.3, 2, 0, 0, '', 'taza', 150, 50, 300, 25],
    ['frutosrojos', 'Frutos rojos (frescos o congelados)', 'fruta', '🫐', 50, 0.7, 12, 0.3, 3, 0, 0, '', 'taza', 140, 50, 250, 10, 'caro'],
    ['uvas', 'Uvas', 'fruta', '🍇', 69, 0.7, 18, 0.2, 0.9, 0, 0, '', 'taza', 150, 50, 250, 10],
    ['anana', 'Ananá', 'fruta', '🍍', 50, 0.5, 13, 0.1, 1.4, 0, 0, '', 'rodaja', 80, 80, 240, 40],
    ['ensfrutas', 'Ensalada de frutas (sin azúcar)', 'fruta', '🍓', 55, 0.6, 14, 0.2, 1.5, 0, 0, '', 'compotera', 200, 100, 300, 25],
    ['sandia', 'Sandía', 'fruta', '🍉', 30, 0.6, 7.6, 0.2, 0.4, 0, 0, '', 'tajada', 250, 100, 500, 50],
    ['melon', 'Melón', 'fruta', '🍈', 34, 0.8, 8.2, 0.2, 0.9, 0, 0, '', 'tajada', 200, 100, 400, 50],
    ['datiles', 'Dátiles', 'fruta', '🟤', 282, 2.5, 75, 0.4, 8, 0, 0, '', 'dátil', 8, 8, 48, 8, 'u'],
    ['pasas', 'Pasas de uva', 'fruta', '🍇', 299, 3.1, 79, 0.5, 3.7, 0, 0, '', 'cda', 15, 10, 45, 5],

    // ── Verduras (cantidades libres o casi libres)
    ['ensalada', 'Hojas verdes (lechuga, rúcula, espinaca)', 'veg', '🥬', 18, 1.4, 3.2, 0.2, 1.8, 0, 1, '', 'plato', 80, 0, 300, 10],
    ['tomate', 'Tomate', 'veg', '🍅', 18, 0.9, 3.9, 0.2, 1.2, 0, 1, '', 'tomate', 120, 0, 300, 10],
    ['zanahoria', 'Zanahoria', 'veg', '🥕', 41, 0.9, 9.6, 0.2, 2.8, 0, 1, '', 'zanahoria', 80, 0, 250, 10],
    ['brocoli', 'Brócoli', 'veg', '🥦', 35, 2.4, 7.2, 0.4, 3.3, 0, 2, '', null, 0, 0, 300, 10],
    ['zapallito', 'Zapallito / zucchini', 'veg', '🥒', 20, 0.9, 4.3, 0.3, 1.4, 0, 2, '', null, 0, 0, 300, 10],
    ['calabaza', 'Calabaza / zapallo', 'veg', '🎃', 40, 0.9, 10.5, 0.1, 3.2, 0, 2, '', null, 0, 0, 300, 10],
    ['mixveg', 'Mix de verduras (salteadas o grilladas)', 'veg', '🥗', 35, 1.5, 7, 0.3, 2.5, 0, 2, '', null, 0, 0, 350, 10],
    ['espinaca', 'Espinaca / acelga (cocida)', 'veg', '🥬', 23, 3, 3.8, 0.3, 2.4, 0, 2, '', null, 0, 0, 300, 10],
    ['champi', 'Champiñones', 'veg', '🍄', 22, 3.1, 3.3, 0.3, 1, 0, 1, '', null, 0, 0, 250, 10],
    ['chauchas', 'Chauchas', 'veg', '🫛', 35, 1.9, 7.9, 0.3, 3.2, 0, 2, '', null, 0, 0, 300, 10],
    ['remolacha', 'Remolacha (cocida)', 'veg', '🟣', 44, 1.7, 10, 0.2, 2, 0, 1, '', null, 0, 0, 250, 10],
    ['morron', 'Morrón', 'veg', '🫑', 26, 1, 6, 0.3, 2.1, 0, 1, '', null, 0, 0, 250, 10],
    ['cebolla', 'Cebolla', 'veg', '🧅', 40, 1.1, 9.3, 0.1, 1.7, 0, 1, '', 'cebolla', 110, 0, 200, 10],
    ['berenjena', 'Berenjena (asada)', 'veg', '🍆', 35, 0.8, 8.7, 0.2, 2.5, 0, 2, '', null, 0, 0, 300, 10],
    ['jardinera', 'Jardinera (en lata)', 'veg', '🥕', 50, 2.5, 9, 0.3, 3.5, 0, 1, '', 'taza', 160, 0, 250, 10],
    ['pepino', 'Pepino', 'veg', '🥒', 15, 0.7, 3.6, 0.1, 0.5, 0, 1, '', null, 0, 0, 250, 10],

    // ── Grasas saludables
    ['aceite', 'Aceite (de oliva o girasol)', 'grasa', '🫒', 884, 0, 0, 100, 0, 0, 1, '', 'cdita', 5, 0, 25, 5, 'u'],
    ['mayolight', 'Mayonesa light', 'grasa', '🥚', 330, 1, 8, 33, 0, 1, 0, 'h', 'cda', 15, 0, 30, 5, 'aprox'],
    ['palta', 'Palta', 'grasa', '🥑', 160, 2, 8.5, 14.7, 6.7, 0, 0, '', 'palta', 150, 20, 150, 10],
    ['mani', 'Maní tostado sin sal', 'grasa', '🥜', 585, 23.7, 21.5, 49.7, 8, 0, 0, 'm', 'puñado', 25, 0, 50, 5],
    ['pastamani', 'Pasta de maní (100% maní)', 'grasa', '🥜', 588, 25, 20, 50, 6, 0, 0, 'm', 'cda', 16, 0, 48, 8],
    ['almendras', 'Almendras', 'grasa', '🌰', 579, 21.2, 21.6, 49.9, 12.5, 0, 0, 'fs', 'puñado', 25, 0, 50, 5, 'caro'],
    ['nueces', 'Nueces', 'grasa', '🌰', 654, 15.2, 13.7, 65.2, 6.7, 0, 0, 'fs', 'puñado', 25, 0, 50, 5, 'caro'],
    ['mixfs', 'Mix de frutos secos', 'grasa', '🥜', 600, 17, 20, 52, 7, 0, 0, 'fs,m', 'puñado', 25, 0, 50, 5, 'aprox'],
    ['chia', 'Semillas de chía', 'grasa', '🌱', 486, 16.5, 42.1, 30.7, 34.4, 0, 0, '', 'cda', 10, 0, 30, 5],
    ['lino', 'Semillas de lino molidas', 'grasa', '🌱', 534, 18.3, 28.9, 42.2, 27.3, 0, 0, '', 'cda', 7, 0, 28, 7],
    ['untable', 'Queso untable light', 'grasa', '🧀', 140, 8, 4, 10, 0, 1, 0, 'l', 'cda', 20, 0, 60, 10],
    ['rallado', 'Queso rallado', 'grasa', '🧀', 420, 28, 14, 28, 0, 1, 0, 'l', 'cda', 5, 0, 20, 5],
    ['aceitunas', 'Aceitunas', 'grasa', '🫒', 145, 1, 3.8, 15.3, 3.3, 0, 0, '', 'aceituna', 4, 0, 40, 4],
    ['manteca', 'Manteca', 'grasa', '🧈', 717, 0.9, 0.1, 81, 0, 1, 0, 'l', 'cdita', 5, 0, 15, 5, 'u'],

    // ── Dulces y extras
    ['miel', 'Miel', 'extra', '🍯', 304, 0.3, 82, 0, 0.2, 1, 0, '', 'cdita', 7, 0, 28, 7, 'u'],
    ['mermelada', 'Mermelada reducida en azúcar', 'extra', '🍓', 130, 0.4, 32, 0.1, 1, 0, 0, '', 'cda', 15, 0, 45, 15, 'u,aprox'],
    ['dulceleche', 'Dulce de leche', 'extra', '🍯', 315, 6.8, 55, 7.5, 0, 1, 0, 'l', 'cdita', 10, 0, 30, 10, 'u'],
    ['membrillo', 'Dulce de membrillo o de batata', 'extra', '🟧', 270, 0.4, 66, 0.1, 1.2, 0, 0, '', 'porción', 30, 0, 60, 10, 'aprox'],
    ['azucar', 'Azúcar', 'extra', '🍬', 400, 0, 100, 0, 0, 0, 0, '', 'cdita', 5, 0, 20, 5, 'u'],
    ['alfajor', 'Alfajor simple', 'extra', '🍪', 430, 5, 63, 18, 1.5, 1, 0, 'g,l,h', 'alfajor', 50, 50, 100, 50, 'u,aprox'],
    ['chocolate', 'Chocolate amargo (70% o más)', 'extra', '🍫', 598, 7.8, 45.9, 42.6, 10.9, 0, 0, '', 'cuadradito', 5, 0, 30, 5, 'u'],

    // ── Listo para comer (se compra hecho)
    ['pollorot', 'Pollo al spiedo / rotisería (sin piel)', 'listo', '🍗', 190, 28, 0, 8.5, 0, 3, 0, '', 'porción', 150, 100, 300, 10, 'aprox'],
    ['sandmiga', 'Sándwich de miga de jamón y queso', 'listo', '🥪', 260, 11, 26, 12, 1.5, 3, 0, 'g,l', 'sándwich', 50, 50, 200, 50, 'u,aprox'],
    ['tostado', 'Tostado de jamón y queso', 'listo', '🥪', 270, 13, 27, 12, 1.5, 3, 0, 'g,l', 'tostado', 130, 65, 260, 65, 'u,aprox'],
    ['empcarne', 'Empanada de carne al horno', 'listo', '🥟', 260, 10, 27, 12, 1.5, 3, 0, 'g', 'empanada', 90, 90, 270, 90, 'u,aprox'],
    ['emppollo', 'Empanada de pollo al horno', 'listo', '🥟', 240, 11, 26, 10, 1.5, 3, 0, 'g', 'empanada', 90, 90, 270, 90, 'u,aprox'],
    ['empverdura', 'Empanada de verdura al horno', 'listo', '🥟', 230, 7, 27, 10, 2, 1, 0, 'g,l', 'empanada', 90, 90, 270, 90, 'u,aprox'],
    ['tortillapapa', 'Tortilla de papas (casera)', 'listo', '🍳', 150, 6, 14, 8, 1.3, 1, 2, 'h', 'porción', 150, 150, 450, 75, 'u,aprox'],
    ['tartaverdura', 'Tarta de verdura (acelga o espinaca)', 'listo', '🥧', 210, 7, 18, 12, 1.8, 1, 2, 'g,h,l', 'porción', 150, 75, 300, 75, 'u,aprox'],
    ['tartajyq', 'Tarta de jamón y queso', 'listo', '🥧', 260, 11, 18, 16, 0.8, 3, 2, 'g,h,l', 'porción', 150, 75, 300, 75, 'u,aprox'],
    ['pastelpapa', 'Pastel de papas', 'listo', '🥘', 140, 8, 12, 7, 1.2, 3, 2, 'l', 'porción', 300, 150, 450, 50, 'aprox'],
    ['locro', 'Locro', 'listo', '🥣', 130, 7, 13, 6, 2.5, 3, 2, '', 'plato', 350, 200, 500, 50, 'aprox'],
    ['sandmila', 'Sándwich de milanesa (lechuga y tomate)', 'listo', '🥪', 230, 13, 22, 10, 1.2, 3, 0, 'g,h', 'sándwich', 280, 140, 280, 140, 'u,aprox'],
    ['pizza', 'Pizza de muzzarella', 'listo', '🍕', 260, 11, 30, 10, 1.5, 1, 0, 'g,l', 'porción', 120, 120, 360, 120, 'u,aprox'],
    ['hamburguesa', 'Hamburguesa simple con queso', 'listo', '🍔', 252, 12.6, 27.7, 10, 1.3, 3, 0, 'g,l', 'hamburguesa', 120, 120, 240, 120, 'u,aprox'],
    ['sushi', 'Sushi (rolls)', 'listo', '🍣', 160, 6, 27, 3, 0.8, 2, 0, 'p', 'pieza', 30, 150, 450, 30, 'u,aprox'],
    ['barraprot', 'Barrita proteica', 'listo', '🍫', 360, 33, 35, 11, 5, 1, 0, 'l,s', 'barrita', 45, 45, 90, 45, 'u,aprox'],
    ['barracereal', 'Barrita de cereal', 'listo', '🍫', 390, 6, 72, 9, 4, 0, 0, 'g', 'barrita', 23, 23, 46, 23, 'u,aprox'],
    ['medialuna', 'Medialuna', 'listo', '🥐', 410, 8, 46, 21, 1.5, 1, 0, 'g,l,h', 'medialuna', 40, 40, 80, 40, 'u,aprox'],

    // ── Libres
    ['cafe', 'Mate, café o té (sin azúcar)', 'libre', '☕', 1, 0.1, 0, 0, 0, 0, 0, '', 'taza', 200, 0, 1000, 50, 'ml'],
    ['agua', 'Agua / soda / bebida zero', 'libre', '💧', 0, 0, 0, 0, 0, 0, 0, '', 'vaso', 250, 0, 1000, 250, 'ml'],
    ['caldo', 'Caldo de verduras casero', 'libre', '🍲', 8, 0.3, 1.5, 0.1, 0.2, 0, 2, '', 'taza', 250, 0, 500, 50, 'ml'],
  ];

  function mk(r) {
    const [id, n, g, e, k, p, c, f, fi, d, ck, al, u, ug, mn, mx, st, fl] = r;
    const fls = (fl || '').split(',');
    return {
      id, n, g, e, k, p, c, f, fi, d, ck,
      al: al ? al.split(',') : [],
      u: u || '', ug: ug || 0, mn, mx, st,
      ml: fls.includes('ml'), uf: fls.includes('u'), ap: fls.includes('aprox'), caro: fls.includes('caro'),
    };
  }

  NG.FOODS = {};
  R.forEach(r => { NG.FOODS[r[0]] = mk(r); });

  // Formato compacto para viajar dentro del link del plan
  NG.packFood = f => [f.n, f.e, f.g, f.k, f.p, f.c, f.f, f.fi || 0, f.u || '', f.ug || 0, f.st || 5,
    (f.ml ? 1 : 0) | (f.uf ? 2 : 0) | (f.ap ? 4 : 0), f.d, (f.al || []).join(','), f.mn, f.mx];
  NG.unpackFood = (id, a) => ({
    id, n: a[0], e: a[1], g: a[2], k: a[3], p: a[4], c: a[5], f: a[6], fi: a[7], u: a[8], ug: a[9], st: a[10],
    ml: !!(a[11] & 1), uf: !!(a[11] & 2), ap: !!(a[11] & 4), d: a[12], al: a[13] ? a[13].split(',') : [], mn: a[14], mx: a[15], ck: 0,
  });

  // Alimentos extra según el modo: personalizados del entrenador o los que vienen dentro del plan.
  NG.extraFoods = {};
  NG.food = id => NG.extraFoods[id] || NG.FOODS[id] || null;
  NG.allFoods = () => Object.assign({}, NG.FOODS, NG.extraFoods);

  NG.ALG = { g: 'Gluten (TACC)', l: 'Lactosa', h: 'Huevo', fs: 'Frutos secos', m: 'Maní', p: 'Pescado', ma: 'Mariscos', s: 'Soja' };
  NG.DIETAS = { 3: 'Omnívoro', 2: 'Pescetariano', 1: 'Vegetariano', 0: 'Vegano' };
  NG.GRUPOS = {
    prot: { n: 'Proteínas', e: '🍗', m: 'p' },
    lact: { n: 'Lácteos y bebidas vegetales', e: '🥛', m: 'p' },
    carb: { n: 'Cereales, panes y tubérculos', e: '🍚', m: 'c' },
    leg: { n: 'Legumbres', e: '🫘', m: 'c' },
    fruta: { n: 'Frutas', e: '🍎', m: 'c' },
    veg: { n: 'Verduras', e: '🥦', m: 'g' },
    grasa: { n: 'Grasas saludables', e: '🥑', m: 'f' },
    extra: { n: 'Dulces y extras', e: '🍯', m: 'k' },
    listo: { n: 'Listo para comer', e: '🥪', m: 'k' },
    libre: { n: 'Libres', e: '☕', m: 'g' },
  };
  // Atajos para "no me gusta" → alimentos que se excluyen
  NG.DISLIKES = {
    'Pescado': ['merluza', 'salmon', 'atun', 'sushi', 'caballa', 'medmerluza'],
    'Carne roja': ['carne', 'picada', 'picadacomun', 'milacarne', 'hambcasera', 'asado', 'empcarne', 'hamburguesa', 'sandmila'],
    'Cerdo': ['cerdo', 'jamon', 'paleta'],
    'Pollo': ['pollo', 'muslo', 'milapollo', 'emppollo', 'pollorot'],
    'Huevo': ['huevo', 'clara'],
    'Lácteos': ['yogriego', 'yogprot', 'yogdesc', 'lechedesc', 'lecheent', 'lechedeslac', 'cottage', 'ricota', 'quesofresco', 'untable', 'rallado', 'quesoblanco', 'quesomaquina', 'quesocremoso', 'yogbebible'],
    'Legumbres': ['lentejas', 'garbanzos', 'porotos', 'hummus', 'arvejas'],
    'Palta': ['palta'],
    'Avena': ['avena', 'granola'],
    'Tofu / soja': ['tofu', 'tempeh', 'tvp', 'bebsoja'],
    'Brócoli': ['brocoli'],
    'Batata': ['batata'],
  };
})(window.NG);
