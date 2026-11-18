// Chef Romane: the page in the six languages Chef Romane speaks (the greeting, the texts and the WhatsApp message switch
// to the one the visitor picks), the seven menus as a card that turns like a page, plates that change on their own,
// the evening that lights up as you scroll, a Christmas band in November and December, and the motion layer (GSAP 3.15).
// Without the script the page reads in English, every menu shows and the buttons open WhatsApp in English.
(() => {
  const PHONE = "16493475343";
  const LANGS = {
    en: { name: "English", locale: "en-GB", greet: "Dinner is served.", hi: "Hi Chef Romane! I found your website and I'd like to book you.",
          menu: m => `Hi Chef Romane! I found your website and I'd like to book the ${m} menu.`, date: "Date", guests: "Guests", where: "Villa or area",
          outOf: "out of", langNow: n => `Your message will be written in ${n}.` },
    es: { name: "Español", locale: "es-ES", greet: "La cena está servida.", hi: "¡Hola, Chef Romane! Vi su página web y me gustaría reservar con usted.",
          menu: m => `¡Hola, Chef Romane! Vi su página web y me gustaría reservar el menú ${m}.`, date: "Fecha", guests: "Invitados", where: "Villa o zona",
          outOf: "de", langNow: n => `Su mensaje se escribirá en ${n}.` },
    fr: { name: "Français", locale: "fr-FR", greet: "Le dîner est servi.", hi: "Bonjour Chef Romane ! J'ai vu votre site et j'aimerais réserver vos services.",
          menu: m => `Bonjour Chef Romane ! J'ai vu votre site et j'aimerais réserver le menu ${m}.`, date: "Date", guests: "Invités", where: "Villa ou quartier",
          outOf: "sur", langNow: n => `Votre message sera écrit en ${n}.` },
    de: { name: "Deutsch", locale: "de-DE", greet: "Das Abendessen ist serviert.", hi: "Hallo Chef Romane! Ich habe Ihre Website gesehen und möchte Sie gerne buchen.",
          menu: m => `Hallo Chef Romane! Ich habe Ihre Website gesehen und möchte gerne das Menü ${m} buchen.`, date: "Datum", guests: "Gäste", where: "Villa oder Gegend",
          outOf: "von", langNow: n => `Ihre Nachricht wird auf ${n} geschrieben.` },
    pt: { name: "Português", locale: "pt-BR", greet: "O jantar está servido.", hi: "Olá, Chef Romane! Vi o seu site e gostaria de reservar os seus serviços.",
          menu: m => `Olá, Chef Romane! Vi o seu site e gostaria de reservar o menu ${m}.`, date: "Data", guests: "Convidados", where: "Villa ou zona",
          outOf: "de", langNow: n => `A sua mensagem será escrita em ${n}.` },
    it: { name: "Italiano", locale: "it-IT", greet: "La cena è servita.", hi: "Ciao Chef Romane! Ho visto il tuo sito e vorrei prenotarti.",
          menu: m => `Ciao Chef Romane! Ho visto il tuo sito e vorrei prenotare il menù ${m}.`, date: "Data", guests: "Ospiti", where: "Villa o zona",
          outOf: "su", langNow: n => `Il tuo messaggio sarà scritto in ${n}.` },
  };

  // The page texts in five more languages; English is what the page itself says. Words with a gender are avoided
  // ("chef a domicilio", not "chef privado"), since nothing says how Chef Romane prefers to be named.
  const T = {
    es: {
      f1: "Chef a domicilio en su villa", f2: "Providenciales, Islas Turcas y Caicos", f3: "Siete menús, desde $150 por persona",
      lede: "Chef Romane hace la compra, cocina, sirve y recoge. Usted solo tiene que sentarse a la mesa.",
      langsNote: "Chef Romane habla seis idiomas. Elija el suyo: la página y su mensaje de WhatsApp cambian a ese idioma.",
      credit: "De Jamaica, cocinando desde los siete años", bookWa: "Reservar por WhatsApp", seeMenus: "Ver los menús",
      xmasText: "Cena de Navidad en su villa: bisque de langosta, jamón y pavo, tarta de manzana.", xmasLink: "Ver el menú de Navidad",
      nightTitle: "Su noche libre", nightLede: "Usted elige el menú. Chef Romane hace el resto, desde la compra hasta dejar la cocina impecable.",
      pBefore: "Antes del día", pDay: "El día", pAfter: "Después de la cena",
      r1: "Menú, fecha e invitados acordados por WhatsApp", t1: "cuando quiera", r2: "Alergias y peticiones especiales anotadas", t2: "por WhatsApp",
      r3: "Compra de ingredientes frescos", t3: "por la tarde", r4: "Chef Romane llega a su villa", r5: "Una bebida de bienvenida del bar",
      r6: "Entrante y primer plato", r7: "Plato principal", r8: "Postre", r9: "Cocina limpia y platos lavados",
      total: "Platos que le toca lavar", timesNote: "Los horarios son un ejemplo. Chef Romane los fija con usted.",
      menusTitle: "Menús", mJamaican: "Cena jamaicana", mItalian: "Italiano", mMediterranean: "Mediterráneo", mPrivateDinner: "Cena privada",
      mBreakfast: "Desayuno", mChristmas: "Navidad", perGuest: "por persona",
      cStarter: "Entrante", cFirst: "Primer plato", cMain: "Principal", cMain2: "Principal, elija dos", cSides: "Guarniciones", cDessert: "Postre",
      cToStart: "Para empezar", cFruit: "Fruta", cHot: "Platos calientes",
      dJ1: "Ensalada fresca reggae", dJ2: "Bocados de pollo jerk, o crema de pollo y calabaza",
      dJ3: "Rabo de res estofado con habas de lima, cerdo jerk, pollo jerk o frito, pescado escovitch",
      dJ4: "Arroz con frijoles rojos, plátano frito y más", dJ5: "Tarta de zanahoria",
      dP1: "Ensalada de pollo con aliño de papaya", dP2: "Camarones al coco con salsa tártara picante", dP3: "Mar y tierra con puré de papas", dP4: "Pastel de chocolate",
      dI1: "Ensalada caprese, pan de ajo con queso y ensalada picada italiana", dI2: "Pollo a la parmesana", dI3: "Pasta con pollo, pasta con camarones, albóndigas y pasta de verduras",
      dM1: "Calamares fritos, mejillones y bruschetta clásica", dM2: "Chuleta de cordero a la parrilla, salmón teriyaki y pollo a la parrilla", dM3: "Verduras variadas a la parrilla y estofado de res",
      dD3: "Cerdo o pollo jerk con arroz con frijoles rojos, o mar y tierra con puré de papas y verduras a la parrilla",
      dB1: "Ackee con bacalao, dumplings fritos, plátano frito, pollo con waffles", dB2: "Bandeja tropical de melón, mango, piña, fresas y uvas",
      dB3: "Huevos, tocino, salchichas, waffles, panqueques, tostadas francesas, sémola con queso, callaloo y repollo al vapor",
      dX1: "Bisque de langosta", dX2: "Ensalada navideña fresca", dX3: "Jamón y pavo con puré de papas, relleno y verduras", dX4: "Tarta de manzana o pastel de Navidad",
      xmasNote: "Para Nochebuena, Navidad o Nochevieja, pregunte con tiempo.", bookMenu: "Reservar este menú",
      menusNote: "Los precios son por persona, según los menús de Chef Romane en Take a Chef. El tamaño del grupo, la fecha y los extras pueden cambiar el precio final: pregunte por WhatsApp.",
      meetTitle: "Conozca a Chef Romane",
      l1: "Empecé a cocinar a los siete años, junto a mi abuela en Jamaica. La cocina sigue siendo mi lugar feliz.",
      l2: "Hice mi formación y certificación en los resorts Beaches y Riu de Jamaica, y tengo 16 años de experiencia en restauración. También preparo cócteles y me encargo del servicio, así que su velada está atendida desde la primera copa hasta el último plato.",
      l3: "Cocino comida de todo el mundo: jamaicana y caribeña, mariscos, italiana, japonesa y fusión. Hablo inglés, español, francés, alemán, portugués e italiano, así que todos en su mesa pueden hablar conmigo en su propio idioma.",
      l4: "Mi promesa es sencilla: <mark>una experiencia perfecta, o le devuelvo su dinero.</mark>",
      role: "Chef a domicilio en Providenciales", msgChef: "Escribir a Chef Romane",
      bookTitle: "Lo que escriben los huéspedes", scoreNote: "sobre 5 en Take a Chef, con 4 reseñas", done: "reservas completadas en Take a Chef",
      readTac: "Léalas en Take a Chef", reviewG: "Reseñar a Chef Romane en Google", quotesNote: "Las reseñas aparecen en su inglés original.",
      visitTitle: "Reserve su noche libre", visitLede: "Envíe a Chef Romane el menú que le guste, la fecha, cuántos invitados son y dónde se alojan.",
      call: "WhatsApp o llamada", email: "Correo", villas: "Villas en todo Providenciales: Grace Bay, Long Bay, Chalk Sound, Turtle Tail y más", tiktok: "Vídeos en TikTok:",
      backLine: "Chef a domicilio en su villa en Providenciales, Islas Turcas y Caicos.",
    },
    fr: {
      f1: "Chef à domicile dans votre villa", f2: "Providenciales, îles Turques-et-Caïques", f3: "Sept menus, à partir de $150 par personne",
      lede: "Chef Romane fait les courses, cuisine, sert et range. Vous n'avez plus qu'à passer à table.",
      langsNote: "Chef Romane parle six langues. Choisissez la vôtre : la page et votre message WhatsApp passent dans cette langue.",
      credit: "De Jamaïque, aux fourneaux depuis l'âge de sept ans", bookWa: "Réserver sur WhatsApp", seeMenus: "Voir les menus",
      xmasText: "Dîner de Noël dans votre villa : bisque de homard, jambon et dinde, tarte aux pommes.", xmasLink: "Voir le menu de Noël",
      nightTitle: "Votre soirée libre", nightLede: "Vous choisissez le menu. Chef Romane s'occupe du reste, des courses jusqu'à une cuisine impeccable.",
      pBefore: "Avant le jour J", pDay: "Le jour J", pAfter: "Après le dîner",
      r1: "Menu, date et invités convenus sur WhatsApp", t1: "quand vous voulez", r2: "Allergies et demandes spéciales notées", t2: "sur WhatsApp",
      r3: "Courses de produits frais", t3: "l'après-midi", r4: "Chef Romane arrive dans votre villa", r5: "Un verre de bienvenue au bar",
      r6: "Entrée et premier plat", r7: "Plat principal", r8: "Dessert", r9: "Cuisine nettoyée, vaisselle faite",
      total: "Assiettes à laver pour vous", timesNote: "Les horaires sont un exemple. Chef Romane les fixe avec vous.",
      menusTitle: "Menus", mJamaican: "Dîner jamaïcain", mItalian: "Italien", mMediterranean: "Méditerranéen", mPrivateDinner: "Dîner privé",
      mBreakfast: "Petit-déjeuner", mChristmas: "Noël", perGuest: "par personne",
      cStarter: "Entrée", cFirst: "Premier plat", cMain: "Plat principal", cMain2: "Plat principal, deux au choix", cSides: "Accompagnements", cDessert: "Dessert",
      cToStart: "Pour commencer", cFruit: "Fruits", cHot: "Plats chauds",
      dJ1: "Salade fraîche reggae", dJ2: "Bouchées de poulet jerk, ou velouté de poulet et potiron",
      dJ3: "Queue de bœuf braisée aux haricots de Lima, porc jerk, poulet jerk ou frit, poisson escovitch",
      dJ4: "Riz aux haricots rouges, bananes plantain frites et plus", dJ5: "Gâteau aux carottes",
      dP1: "Salade de poulet, vinaigrette à la papaye", dP2: "Crevettes coco, sauce tartare épicée", dP3: "Surf and turf avec purée de pommes de terre", dP4: "Gâteau au chocolat",
      dI1: "Salade caprese, pain à l'ail au fromage et salade italienne hachée", dI2: "Poulet parmigiana", dI3: "Pâtes au poulet, pâtes aux crevettes, boulettes de viande et pâtes aux légumes",
      dM1: "Calamars frits, moules et bruschetta classique", dM2: "Côtelette d'agneau grillée, saumon teriyaki et poulet grillé", dM3: "Légumes grillés variés et ragoût de bœuf",
      dD3: "Porc ou poulet jerk avec riz aux haricots rouges, ou surf and turf avec purée et légumes grillés",
      dB1: "Ackee et morue salée, dumplings frits, banane plantain frite, poulet et gaufres", dB2: "Plateau tropical de melon, mangue, ananas, fraises et raisins",
      dB3: "Œufs, bacon, saucisses, gaufres, pancakes, pain perdu, gruau au fromage, callaloo et chou vapeur",
      dX1: "Bisque de homard", dX2: "Salade de Noël fraîche", dX3: "Jambon et dinde, purée, farce et légumes", dX4: "Tarte aux pommes ou gâteau de Noël",
      xmasNote: "Pour le réveillon, le jour de Noël ou la Saint-Sylvestre, demandez tôt.", bookMenu: "Réserver ce menu",
      menusNote: "Les prix sont par personne, d'après les menus de Chef Romane sur Take a Chef. La taille du groupe, la date et les extras peuvent changer le prix final : demandez sur WhatsApp.",
      meetTitle: "Rencontrez Chef Romane",
      l1: "J'ai commencé à cuisiner à sept ans, aux côtés de ma grand-mère en Jamaïque. La cuisine reste mon endroit préféré.",
      l2: "J'ai suivi ma formation et obtenu ma certification dans les resorts Beaches et Riu en Jamaïque, et j'ai 16 ans d'expérience en restauration. Je m'occupe aussi des cocktails et du service, du premier verre à la dernière assiette.",
      l3: "Je cuisine des plats du monde entier : jamaïcains et caribéens, fruits de mer, italiens, japonais et fusion. Je parle anglais, espagnol, français, allemand, portugais et italien, donc chacun à votre table peut me parler dans sa langue.",
      l4: "Ma promesse est simple : <mark>une expérience parfaite, ou je vous rembourse.</mark>",
      role: "Chef à domicile à Providenciales", msgChef: "Écrire à Chef Romane",
      bookTitle: "Ce qu'écrivent les clients", scoreNote: "sur 5 sur Take a Chef, d'après 4 avis", done: "réservations réalisées via Take a Chef",
      readTac: "Les lire sur Take a Chef", reviewG: "Laisser un avis sur Google", quotesNote: "Les avis sont affichés dans leur anglais d'origine.",
      visitTitle: "Réservez votre soirée libre", visitLede: "Envoyez à Chef Romane le menu qui vous plaît, la date, le nombre d'invités et votre lieu de séjour.",
      call: "WhatsApp ou appel", email: "E-mail", villas: "Villas dans tout Providenciales : Grace Bay, Long Bay, Chalk Sound, Turtle Tail et plus", tiktok: "Vidéos sur TikTok :",
      backLine: "Chef à domicile dans votre villa à Providenciales, îles Turques-et-Caïques.",
    },
    de: {
      f1: "Private Chef in Ihrer Villa", f2: "Providenciales, Turks- und Caicosinseln", f3: "Sieben Menüs, ab $150 pro Person",
      lede: "Chef Romane kauft ein, kocht, serviert und räumt auf. Sie müssen sich nur noch an den Tisch setzen.",
      langsNote: "Chef Romane spricht sechs Sprachen. Wählen Sie Ihre: Die Seite und Ihre WhatsApp-Nachricht wechseln in diese Sprache.",
      credit: "Aus Jamaika, am Herd seit dem siebten Lebensjahr", bookWa: "Über WhatsApp buchen", seeMenus: "Menüs ansehen",
      xmasText: "Weihnachtsessen in Ihrer Villa: Hummercremesuppe, Schinken und Truthahn, Apfelkuchen.", xmasLink: "Weihnachtsmenü ansehen",
      nightTitle: "Ihr freier Abend", nightLede: "Sie wählen das Menü. Chef Romane erledigt den Rest, vom Einkauf bis zur blitzsauberen Küche.",
      pBefore: "Vor dem Tag", pDay: "Am Tag", pAfter: "Nach dem Essen",
      r1: "Menü, Datum und Gäste per WhatsApp abgestimmt", t1: "jederzeit", r2: "Allergien und Sonderwünsche notiert", t2: "per WhatsApp",
      r3: "Frische Zutaten eingekauft", t3: "nachmittags", r4: "Chef Romane kommt in Ihre Villa", r5: "Ein Begrüßungsdrink von der Bar",
      r6: "Vorspeise und erster Gang", r7: "Hauptgang", r8: "Dessert", r9: "Küche sauber, Geschirr gespült",
      total: "Teller, die Sie spülen müssen", timesNote: "Die Zeiten sind ein Beispiel. Chef Romane legt sie mit Ihnen fest.",
      menusTitle: "Menüs", mJamaican: "Jamaikanisches Dinner", mItalian: "Italienisch", mMediterranean: "Mediterran", mPrivateDinner: "Privates Dinner",
      mBreakfast: "Frühstück", mChristmas: "Weihnachten", perGuest: "pro Person",
      cStarter: "Vorspeise", cFirst: "Erster Gang", cMain: "Hauptgang", cMain2: "Hauptgang, zwei nach Wahl", cSides: "Beilagen", cDessert: "Dessert",
      cToStart: "Zum Start", cFruit: "Obst", cHot: "Warme Gerichte",
      dJ1: "Frischer Reggae-Salat", dJ2: "Jerk-Hähnchenhappen oder Hähnchen-Kürbis-Cremesuppe",
      dJ3: "Geschmorter Ochsenschwanz mit Limabohnen, Jerk-Schwein, Jerk- oder Brathähnchen, Escovitch-Fisch",
      dJ4: "Reis mit Kidneybohnen, gebratene Kochbananen und mehr", dJ5: "Karottenkuchen",
      dP1: "Hähnchensalat mit Papaya-Dressing", dP2: "Kokos-Garnelen mit scharfer Tatarensauce", dP3: "Surf and Turf mit Kartoffelpüree", dP4: "Schokoladenkuchen",
      dI1: "Caprese-Salat, Knoblauchbrot mit Käse und gehackter italienischer Salat", dI2: "Hähnchen Parmigiana", dI3: "Pasta mit Hähnchen, Pasta mit Garnelen, Fleischbällchen und Gemüsepasta",
      dM1: "Frittierte Calamari, Miesmuscheln und klassische Bruschetta", dM2: "Gegrilltes Lammkotelett, Teriyaki-Lachs und gegrilltes Hähnchen", dM3: "Gegrilltes Gemüse und Rindereintopf",
      dD3: "Jerk-Schwein oder -Hähnchen mit Reis und Kidneybohnen, oder Surf and Turf mit Kartoffelpüree und gegrilltem Gemüse",
      dB1: "Ackee mit Stockfisch, frittierte Dumplings, gebratene Kochbanane, Hähnchen mit Waffeln", dB2: "Tropische Platte mit Melone, Mango, Ananas, Erdbeeren und Trauben",
      dB3: "Eier, Speck, Würstchen, Waffeln, Pancakes, French Toast, Käse-Grits, gedämpfter Callaloo und Kohl",
      dX1: "Hummercremesuppe", dX2: "Frischer Weihnachtssalat", dX3: "Schinken und Truthahn mit Kartoffelpüree, Füllung und Gemüse", dX4: "Apfelkuchen oder Weihnachtskuchen",
      xmasNote: "Für Heiligabend, Weihnachten oder Silvester früh anfragen.", bookMenu: "Dieses Menü buchen",
      menusNote: "Die Preise gelten pro Person laut Chef Romanes Menüs auf Take a Chef. Gruppengröße, Datum und Extras können den Endpreis ändern, fragen Sie per WhatsApp.",
      meetTitle: "Lernen Sie Chef Romane kennen",
      l1: "Ich habe mit sieben angefangen zu kochen, neben meiner Großmutter in Jamaika. Die Küche ist bis heute mein Glücksort.",
      l2: "Meine Ausbildung und Zertifizierung habe ich in den Resorts Beaches und Riu auf Jamaika gemacht, und ich habe 16 Jahre Erfahrung in der Gastronomie. Ich mixe auch Drinks und kümmere mich um den Service, damit Ihr Abend vom ersten Drink bis zum letzten Teller umsorgt ist.",
      l3: "Ich koche Gerichte aus aller Welt: jamaikanisch und karibisch, Meeresfrüchte, italienisch, japanisch und Fusion. Ich spreche Englisch, Spanisch, Französisch, Deutsch, Portugiesisch und Italienisch, damit alle an Ihrem Tisch in ihrer eigenen Sprache mit mir reden können.",
      l4: "Mein Versprechen ist einfach: <mark>ein perfektes Erlebnis oder Ihr Geld zurück.</mark>",
      role: "Private Chef in Providenciales", msgChef: "Chef Romane schreiben",
      bookTitle: "Was Gäste schreiben", scoreNote: "von 5 auf Take a Chef, aus 4 Bewertungen", done: "über Take a Chef abgeschlossene Buchungen",
      readTac: "Auf Take a Chef lesen", reviewG: "Chef Romane auf Google bewerten", quotesNote: "Die Bewertungen stehen im englischen Original.",
      visitTitle: "Buchen Sie Ihren freien Abend", visitLede: "Schicken Sie Chef Romane Ihr Wunschmenü, das Datum, die Zahl der Gäste und Ihre Unterkunft.",
      call: "WhatsApp oder Anruf", email: "E-Mail", villas: "Villen in ganz Providenciales: Grace Bay, Long Bay, Chalk Sound, Turtle Tail und mehr", tiktok: "Videos auf TikTok:",
      backLine: "Private Chef in Ihrer Villa in Providenciales, Turks- und Caicosinseln.",
    },
    pt: {
      f1: "Chef particular na sua villa", f2: "Providenciales, Turcas e Caicos", f3: "Sete menus, a partir de $150 por pessoa",
      lede: "Chef Romane faz as compras, cozinha, serve e arruma tudo. Você só precisa se sentar à mesa.",
      langsNote: "Chef Romane fala seis idiomas. Escolha o seu: a página e a sua mensagem de WhatsApp mudam para esse idioma.",
      credit: "Da Jamaica, cozinhando desde os sete anos", bookWa: "Reservar pelo WhatsApp", seeMenus: "Ver os menus",
      xmasText: "Ceia de Natal na sua villa: bisque de lagosta, presunto e peru, torta de maçã.", xmasLink: "Ver o menu de Natal",
      nightTitle: "A sua noite de folga", nightLede: "Você escolhe o menu. Chef Romane faz o resto, das compras até a cozinha impecável.",
      pBefore: "Antes do dia", pDay: "No dia", pAfter: "Depois do jantar",
      r1: "Menu, data e convidados combinados pelo WhatsApp", t1: "quando quiser", r2: "Alergias e pedidos especiais anotados", t2: "pelo WhatsApp",
      r3: "Compra de ingredientes frescos", t3: "à tarde", r4: "Chef Romane chega à sua villa", r5: "Uma bebida de boas-vindas do bar",
      r6: "Entrada e primeiro prato", r7: "Prato principal", r8: "Sobremesa", r9: "Cozinha limpa e louça lavada",
      total: "Pratos para você lavar", timesNote: "Os horários são um exemplo. Chef Romane combina com você.",
      menusTitle: "Menus", mJamaican: "Jantar jamaicano", mItalian: "Italiano", mMediterranean: "Mediterrâneo", mPrivateDinner: "Jantar privado",
      mBreakfast: "Café da manhã", mChristmas: "Natal", perGuest: "por pessoa",
      cStarter: "Entrada", cFirst: "Primeiro prato", cMain: "Principal", cMain2: "Principal, escolha dois", cSides: "Acompanhamentos", cDessert: "Sobremesa",
      cToStart: "Para começar", cFruit: "Frutas", cHot: "Pratos quentes",
      dJ1: "Salada fresca reggae", dJ2: "Pedacinhos de frango jerk, ou creme de frango e abóbora",
      dJ3: "Rabada estufada com feijão-de-lima, porco jerk, frango jerk ou frito, peixe escovitch",
      dJ4: "Arroz com feijão, banana-da-terra frita e mais", dJ5: "Bolo de cenoura",
      dP1: "Salada de frango com molho de papaia", dP2: "Camarão no coco com molho tártaro picante", dP3: "Surf and turf com purê de batata", dP4: "Bolo de chocolate",
      dI1: "Salada caprese, pão de alho com queijo e salada italiana picada", dI2: "Frango à parmegiana", dI3: "Massa com frango, massa com camarão, almôndegas e massa de legumes",
      dM1: "Lula frita, mexilhões e bruschetta clássica", dM2: "Costeleta de cordeiro grelhada, salmão teriyaki e frango grelhado", dM3: "Legumes grelhados variados e ensopado de carne",
      dD3: "Porco ou frango jerk com arroz com feijão, ou surf and turf com purê de batata e legumes grelhados",
      dB1: "Ackee com bacalhau, bolinhos fritos, banana-da-terra frita, frango com waffles", dB2: "Travessa tropical de melão, manga, abacaxi, morangos e uvas",
      dB3: "Ovos, bacon, salsicha, waffles, panquecas, rabanada, grits com queijo, callaloo e repolho no vapor",
      dX1: "Bisque de lagosta", dX2: "Salada fresca de Natal", dX3: "Presunto e peru com purê de batata, recheio e legumes", dX4: "Torta de maçã ou bolo de Natal",
      xmasNote: "Para a véspera de Natal, o dia de Natal ou o Réveillon, pergunte com antecedência.", bookMenu: "Reservar este menu",
      menusNote: "Os preços são por pessoa, segundo os menus de Chef Romane no Take a Chef. O tamanho do grupo, a data e os extras podem mudar o preço final: pergunte pelo WhatsApp.",
      meetTitle: "Conheça Chef Romane",
      l1: "Comecei a cozinhar aos sete anos, ao lado da minha avó na Jamaica. A cozinha continua sendo o meu lugar feliz.",
      l2: "Fiz a minha formação e certificação nos resorts Beaches e Riu, na Jamaica, e tenho 16 anos de experiência em restauração. Também preparo drinks e cuido do serviço, por isso a sua noite fica bem cuidada do primeiro drink ao último prato.",
      l3: "Cozinho comida do mundo inteiro: jamaicana e caribenha, frutos do mar, italiana, japonesa e fusão. Falo inglês, espanhol, francês, alemão, português e italiano, por isso todos à sua mesa podem falar comigo na própria língua.",
      l4: "A minha promessa é simples: <mark>uma experiência perfeita, ou o seu dinheiro de volta.</mark>",
      role: "Chef particular em Providenciales", msgChef: "Escrever para Chef Romane",
      bookTitle: "O que os hóspedes escrevem", scoreNote: "de 5 no Take a Chef, com 4 avaliações", done: "reservas concluídas pelo Take a Chef",
      readTac: "Leia no Take a Chef", reviewG: "Avaliar Chef Romane no Google", quotesNote: "As avaliações aparecem no inglês original.",
      visitTitle: "Reserve a sua noite de folga", visitLede: "Envie a Chef Romane o menu que preferir, a data, quantos convidados são e onde estão hospedados.",
      call: "WhatsApp ou ligação", email: "E-mail", villas: "Villas em toda Providenciales: Grace Bay, Long Bay, Chalk Sound, Turtle Tail e mais", tiktok: "Vídeos no TikTok:",
      backLine: "Chef particular na sua villa em Providenciales, Turcas e Caicos.",
    },
    it: {
      f1: "Chef a domicilio nella tua villa", f2: "Providenciales, Turks e Caicos", f3: "Sette menù, da $150 a persona",
      lede: "Chef Romane fa la spesa, cucina, serve e riordina. A te basta sederti a tavola.",
      langsNote: "Chef Romane parla sei lingue. Scegli la tua: la pagina e il tuo messaggio WhatsApp passano a quella lingua.",
      credit: "Dalla Giamaica, ai fornelli dall'età di sette anni", bookWa: "Prenota su WhatsApp", seeMenus: "Vedi i menù",
      xmasText: "Cena di Natale nella tua villa: bisque di aragosta, prosciutto e tacchino, torta di mele.", xmasLink: "Vedi il menù di Natale",
      nightTitle: "La tua serata libera", nightLede: "Tu scegli il menù. Chef Romane pensa al resto, dalla spesa a una cucina impeccabile.",
      pBefore: "Prima del giorno", pDay: "Il giorno", pAfter: "Dopo cena",
      r1: "Menù, data e ospiti concordati su WhatsApp", t1: "quando vuoi", r2: "Allergie e richieste speciali annotate", t2: "su WhatsApp",
      r3: "Spesa di ingredienti freschi", t3: "il pomeriggio", r4: "Chef Romane arriva nella tua villa", r5: "Un drink di benvenuto dal bar",
      r6: "Antipasto e primo", r7: "Piatto principale", r8: "Dolce", r9: "Cucina pulita, piatti lavati",
      total: "Piatti che devi lavare", timesNote: "Gli orari sono un esempio. Chef Romane li decide con te.",
      menusTitle: "Menù", mJamaican: "Cena giamaicana", mItalian: "Italiano", mMediterranean: "Mediterraneo", mPrivateDinner: "Cena privata",
      mBreakfast: "Colazione", mChristmas: "Natale", perGuest: "a persona",
      cStarter: "Antipasto", cFirst: "Primo", cMain: "Secondo", cMain2: "Secondo, scegline due", cSides: "Contorni", cDessert: "Dolce",
      cToStart: "Per iniziare", cFruit: "Frutta", cHot: "Piatti caldi",
      dJ1: "Insalata fresca reggae", dJ2: "Bocconcini di pollo jerk, o crema di pollo e zucca",
      dJ3: "Coda di bue brasata con fagioli di Lima, maiale jerk, pollo jerk o fritto, pesce escovitch",
      dJ4: "Riso e fagioli, platano fritto e altro", dJ5: "Torta di carote",
      dP1: "Insalata di pollo con condimento alla papaya", dP2: "Gamberi al cocco con salsa tartara piccante", dP3: "Surf and turf con purè di patate", dP4: "Torta al cioccolato",
      dI1: "Insalata caprese, pane all'aglio con formaggio e insalata italiana tritata", dI2: "Pollo alla parmigiana", dI3: "Pasta al pollo, pasta ai gamberi, polpette e pasta alle verdure",
      dM1: "Calamari fritti, cozze e bruschetta classica", dM2: "Costoletta d'agnello alla griglia, salmone teriyaki e pollo alla griglia", dM3: "Verdure grigliate miste e spezzatino di manzo",
      dD3: "Maiale o pollo jerk con riso e fagioli, o surf and turf con purè di patate e verdure grigliate",
      dB1: "Ackee e baccalà, dumpling fritti, platano fritto, pollo e waffle", dB2: "Vassoio tropicale di melone, mango, ananas, fragole e uva",
      dB3: "Uova, bacon, salsiccia, waffle, pancake, French toast, grits al formaggio, callaloo e cavolo al vapore",
      dX1: "Bisque di aragosta", dX2: "Insalata fresca di Natale", dX3: "Prosciutto e tacchino con purè di patate, ripieno e verdure", dX4: "Torta di mele o dolce di Natale",
      xmasNote: "Per la Vigilia, il giorno di Natale o Capodanno, chiedi per tempo.", bookMenu: "Prenota questo menù",
      menusNote: "I prezzi sono a persona, secondo i menù di Chef Romane su Take a Chef. Numero di ospiti, data ed extra possono cambiare il prezzo finale: chiedi su WhatsApp.",
      meetTitle: "Ecco Chef Romane",
      l1: "Ho iniziato a cucinare a sette anni, accanto a mia nonna in Giamaica. La cucina è ancora il mio posto felice.",
      l2: "Ho fatto la mia formazione e preso la certificazione nei resort Beaches e Riu in Giamaica, e ho 16 anni di esperienza nella ristorazione. Preparo anche i drink e curo il servizio, così la tua serata è seguita dal primo drink all'ultimo piatto.",
      l3: "Cucino piatti da tutto il mondo: giamaicani e caraibici, pesce, italiani, giapponesi e fusion. Parlo inglese, spagnolo, francese, tedesco, portoghese e italiano, così tutti al tuo tavolo possono parlarmi nella loro lingua.",
      l4: "La mia promessa è semplice: <mark>un'esperienza perfetta, o ti restituisco i soldi.</mark>",
      role: "Chef a domicilio a Providenciales", msgChef: "Scrivi a Chef Romane",
      bookTitle: "Cosa scrivono gli ospiti", scoreNote: "su 5 su Take a Chef, da 4 recensioni", done: "prenotazioni completate tramite Take a Chef",
      readTac: "Leggile su Take a Chef", reviewG: "Recensisci Chef Romane su Google", quotesNote: "Le recensioni sono nell'inglese originale.",
      visitTitle: "Prenota la tua serata libera", visitLede: "Manda a Chef Romane il menù che preferisci, la data, quanti ospiti siete e dove alloggiate.",
      call: "WhatsApp o chiamata", email: "Email", villas: "Ville in tutta Providenciales: Grace Bay, Long Bay, Chalk Sound, Turtle Tail e altro", tiktok: "Video su TikTok:",
      backLine: "Chef a domicilio nella tua villa a Providenciales, Turks e Caicos.",
    },
  };
  const ORDER = ["en", "es", "fr", "de", "pt", "it"];
  const VID = { en: ["Pause", "Play"], es: ["Pausar", "Reproducir"], fr: ["Pause", "Lecture"], de: ["Pause", "Abspielen"], pt: ["Pausar", "Reproduzir"], it: ["Pausa", "Riproduci"] };
  document.documentElement.classList.add("js-video");
  let heroPaused = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined" && !reduce;

  /* ---------- The language: texts, numbers, the greeting and the WhatsApp message ---------- */
  let lang = "en";
  let chosen = false;
  try {
    const saved = localStorage.getItem("romane-lang");
    if (saved && LANGS[saved]) { lang = saved; chosen = true; }
  } catch (e) { /* private window: stay in English */ }

  const textEls = [...document.querySelectorAll("[data-i18n]")];
  const htmlEls = [...document.querySelectorAll("[data-i18n-html]")];
  const timeEls = [...document.querySelectorAll("[data-time]")];
  const rateEls = [...document.querySelectorAll("[data-rate]")];
  const original = new Map();
  const EN = {};
  textEls.forEach(el => { original.set(el, el.textContent); if (!(el.dataset.i18n in EN)) EN[el.dataset.i18n] = el.textContent.trim(); });
  htmlEls.forEach(el => original.set(el, el.innerHTML));
  timeEls.forEach(el => original.set(el, el.textContent));
  const splits = new Map();

  const num = (v, dec) => Number(v).toLocaleString(LANGS[lang].locale, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const menuName = key => {
    const en = EN[key] || key;
    const local = T[lang] && T[lang][key];
    return local && local !== en ? `${local} (${en})` : en;
  };
  const message = key => {
    const L = LANGS[lang];
    const colon = lang === "fr" ? " :" : ":";
    return [key ? L.menu(menuName(key)) : L.hi, "", `${L.date}${colon} `, `${L.guests}${colon} `, `${L.where}${colon} `].join("\n");
  };

  function translate() {
    const D = T[lang];
    splits.forEach(s => s.revert());
    splits.clear();
    textEls.forEach(el => { const v = D && D[el.dataset.i18n]; el.textContent = v != null ? v : original.get(el); });
    htmlEls.forEach(el => { const v = D && D[el.dataset.i18nHtml]; el.innerHTML = v != null ? v : original.get(el); });
    timeEls.forEach(el => { el.textContent = lang === "en" ? original.get(el) : el.dataset.time; });
    rateEls.forEach(el => { el.textContent = `${num(el.dataset.rate, String(el.dataset.rate).includes(".") ? 1 : 0)} ${LANGS[lang].outOf} 5`; });
    document.querySelectorAll("[data-count]").forEach(el => { el.textContent = num(el.dataset.count, +(el.dataset.dec || 0)); });
    const note = document.querySelector(".quotes-note");
    if (note) note.hidden = lang === "en";
    const now = document.querySelector(".lang-now");
    if (now) now.innerHTML = LANGS[lang].langNow(`<b>${LANGS[lang].name}</b>`);
    document.querySelectorAll(".vid-toggle").forEach(b => { b.textContent = VID[lang][b.dataset.paused === "true" ? 1 : 0]; });
    document.documentElement.lang = lang;
  }
  function paint() {
    document.querySelectorAll("[data-wa]").forEach(a => { a.href = `https://wa.me/${PHONE}?text=${enc(message(a.dataset.menu))}`; });
    document.querySelectorAll("[data-lang-name]").forEach(el => { el.textContent = LANGS[lang].name; });
    document.querySelectorAll(".chip[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  const greet = document.querySelector(".greet-line");
  let shown = "en";
  function showGreeting(code, animate) {
    if (!greet || code === shown) return;
    const swap = () => { greet.textContent = LANGS[code].greet; greet.lang = code; shown = code; };
    if (!animate || !motion) { swap(); return; }
    gsap.killTweensOf(greet);
    gsap.to(greet, {
      yPercent: -100, autoAlpha: 0, duration: 0.32, ease: "power2.in",
      onComplete: () => {
        swap();
        gsap.fromTo(greet, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" });
      },
    });
  }
  let cycle = null;
  function startCycle() {
    if (!motion || chosen || cycle) return;
    let i = 0;
    cycle = setInterval(() => {
      if (document.hidden || heroPaused) return;
      i = (i + 1) % ORDER.length;
      showGreeting(ORDER[i], true);
    }, 2800);
  }

  function setLang(code, animate) {
    lang = code;
    translate();
    paint();
    showGreeting(code, animate);
    if (motion) {
      const changed = [...textEls, ...htmlEls].filter(el => el.offsetParent && el.getBoundingClientRect().bottom > 0 && el.getBoundingClientRect().top < innerHeight);
      gsap.fromTo(changed, { autoAlpha: 0.15 }, { autoAlpha: 1, duration: 0.45, stagger: 0.01, ease: "power2.out", overwrite: "auto" });
      ScrollTrigger.refresh();
    }
  }
  document.querySelectorAll(".chip[data-lang]").forEach(b => b.addEventListener("click", () => {
    chosen = true;
    if (cycle) { clearInterval(cycle); cycle = null; }
    try { localStorage.setItem("romane-lang", b.dataset.lang); } catch (e) { /* not kept, still works */ }
    setLang(b.dataset.lang, true);
  }));
  if (chosen) { translate(); showGreeting(lang, false); }
  paint();

  /* ---------- The seven menus: a card that turns like a page ---------- */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute("aria-controls")));
  const menuCard = document.getElementById("menu-card");
  const narrow = window.matchMedia("(max-width: 1099px)");
  function select(i, opts = {}) {
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    const show = () => panels.forEach((p, j) => { p.hidden = j !== i; });
    if (opts.focus) tabs[i].focus();
    if (opts.animate && motion && menuCard) {
      gsap.killTweensOf(menuCard, "rotationY");
      gsap.timeline()
        .to(menuCard, { rotationY: 86, duration: 0.2, ease: "power2.in", transformPerspective: 1400 })
        .add(show)
        .fromTo(menuCard, { rotationY: -86 }, { rotationY: 0, duration: 0.36, ease: "power2.out", transformPerspective: 1400 });
    } else {
      show();
    }
    if (opts.scroll && narrow.matches && menuCard) {
      const top = menuCard.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.55 || top < 0) menuCard.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(i, { animate: true, scroll: true }));
    t.addEventListener("keydown", e => {
      let j = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      select(j, { focus: true, animate: true });
    });
  });
  if (tabs.length && panels.every(Boolean)) select(0);

  /* ---------- Christmas: a band in November and December that opens the Christmas menu ---------- */
  const xmas = document.getElementById("xmas");
  const month = new Date().getMonth();
  if (xmas && (month === 10 || month === 11)) xmas.hidden = false;
  document.querySelectorAll("[data-open-tab]").forEach(a => a.addEventListener("click", () => {
    const i = tabs.findIndex(t => t.id === a.dataset.openTab);
    if (i >= 0) select(i);
  }));

  /* ---------- The booking stub: on after the menu card, off over the reviews, the booking card and the footer ---------- */
  const stub = document.querySelector(".stub");
  const heroCard = document.querySelector(".card");
  if (stub && heroCard && "IntersectionObserver" in window) {
    let past = false;
    const covering = new Set();
    const set = () => stub.classList.toggle("is-on", past && covering.size === 0);
    new IntersectionObserver(([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; set(); }).observe(heroCard);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) covering.add(e.target); else covering.delete(e.target); });
      set();
    }, { threshold: 0.2 });
    document.querySelectorAll(".book, .visit, .back").forEach(el => io.observe(el));
    // Large type never slides under the stub: while a heading crosses the bottom fifth of the screen, the stub steps away.
    const band = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) covering.add(e.target); else covering.delete(e.target); });
      set();
    }, { rootMargin: "-78% 0px 0px 0px" });
    document.querySelectorAll("main h2, .xmas p, .night-copy > p").forEach(el => band.observe(el));
  }

  /* ---------- The evening ---------- */
  const night = document.querySelector(".night");
  const rows = night ? [...night.querySelectorAll(".rows li")] : [];
  const photos = night ? [...night.querySelectorAll(".np")] : [];
  const showStep = s => photos.forEach(p => p.classList.toggle("is-on", +p.dataset.step === s));
  const light = p => {
    const lit = Math.min(rows.length, 1 + Math.floor(p * rows.length));
    rows.forEach((r, i) => r.classList.toggle("is-lit", i < lit));
    showStep(lit ? +rows[lit - 1].dataset.step : 0);
  };

  /* ---------- Chef Romane's own videos: they play while on screen, each has a pause button, and under reduced
     motion they wait on their still frame. Pausing the lobster in the hero also stops the plates and the greeting. ---------- */
  const paused = new Set();
  const label = (btn, isPaused) => { btn.dataset.paused = String(isPaused); btn.textContent = VID[lang][isPaused ? 1 : 0]; };
  const tryPlay = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  document.querySelectorAll(".vid-toggle").forEach(btn => {
    const v = document.querySelector(btn.dataset.video);
    if (!v) return;
    if (reduce) paused.add(v);
    label(btn, reduce);
    btn.addEventListener("click", () => {
      const nowPaused = !paused.has(v);
      if (nowPaused) { paused.add(v); v.pause(); } else { paused.delete(v); tryPlay(v); }
      label(btn, nowPaused);
      if (v.classList.contains("hero-video")) heroPaused = nowPaused;
    });
  });
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting && !paused.has(e.target)) tryPlay(e.target);
      else if (!e.isIntersecting) e.target.pause();
    }), { threshold: 0.25 });
    document.querySelectorAll("video").forEach(v => vio.observe(v));
  }

  /* ---------- Rolling numbers ---------- */
  function count(el) {
    const to = parseFloat(el.dataset.count);
    const dec = +(el.dataset.dec || 0);
    if (!motion || Number.isNaN(to)) return;
    const o = { v: 0 };
    gsap.fromTo(o, { v: 0 }, {
      v: to, duration: 1.6, ease: "power2.out", immediateRender: false,
      onStart: () => { el.textContent = num(0, dec); },
      onUpdate: () => { el.textContent = num(o.v, dec); },
      onComplete: () => { el.textContent = num(to, dec); },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }

  if (!motion) return;

  /* ---------- Motion ---------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  document.documentElement.classList.add("js-motion");

  // The plates: four of Chef Romane's dishes at a time, one changing every few seconds.
  const POOL = [
    { src: "img/fruit-420.jpg", set: "img/fruit-420.jpg 420w, img/fruit-720.jpg 720w", alt: "Three platters of carved watermelon, mango, pineapple, kiwi and berries" },
    { src: "img/skewers-420.jpg", set: "img/skewers-420.jpg 420w, img/skewers-720.jpg 720w", alt: "Skewers with peppers and onions, salads and a jug of gravy laid out in a kitchen" },
    { src: "img/pool-breakfast-420.jpg", set: "img/pool-breakfast-420.jpg 420w, img/pool-breakfast-720.jpg 538w", alt: "A breakfast tray floating in a villa pool, with fruit, waffles, fried chicken, dumplings and juice" },
    { src: "img/board-420.jpg", set: "img/board-420.jpg 420w, img/board-720.jpg 720w", alt: "A sharing board of cheese, crackers, nuts, grapes, olives and salami" },
    { src: "img/fritters-420.jpg", set: "img/fritters-420.jpg 420w, img/fritters-720.jpg 720w", alt: "Golden fritters, fresh fruit and a dip in a bowl on a woven placemat" },
    { src: "img/lobster-420.jpg", set: "img/lobster-420.jpg 420w, img/lobster-720.jpg 720w", alt: "A lobster tail plated with lemon, a creamy sauce and asparagus" },
  ];
  const plates = [...document.querySelectorAll(".plate")];
  const plateImgs = plates.map(p => p.querySelector("img"));
  const swappable = plates.map((p, i) => i).filter(i => plateImgs[i]);
  const onPlate = plateImgs.map(img => (img ? POOL.findIndex(x => x.src === img.getAttribute("src")) : -1));
  const waiting = POOL.map((x, k) => k).filter(k => !onPlate.includes(k));
  POOL.forEach(p => { const im = new Image(); im.src = p.src; });
  let turn = 0;
  function swapPlate() {
    if (heroPaused || document.hidden || !swappable.length || !waiting.length) return;
    const i = swappable[turn++ % swappable.length];
    const img = plateImgs[i];
    const next = waiting.shift();
    waiting.push(onPlate[i]);
    onPlate[i] = next;
    gsap.to(img, {
      autoAlpha: 0, scale: 0.9, duration: 0.35, ease: "power2.in",
      onComplete: () => {
        img.srcset = POOL[next].set;
        img.src = POOL[next].src;
        img.alt = POOL[next].alt;
        gsap.to(img, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" });
      },
    });
  }

  // The plates lean towards the pointer on a desktop, as if the table moved under the hand.
  function enableTilt() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1100px)").matches) return;
    const hero = document.querySelector(".hero");
    const depth = [22, 14, 18, 26];
    const qx = plates.map(p => gsap.quickTo(p, "x", { duration: 0.9, ease: "power3" }));
    const qy = plates.map(p => gsap.quickTo(p, "y", { duration: 0.9, ease: "power3" }));
    hero.addEventListener("pointermove", e => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      plates.forEach((p, i) => { qx[i](nx * depth[i]); qy[i](ny * depth[i]); });
    });
  }

  // On load: the card is set down, the name rises letter by letter, the plates are served from both sides.
  const h1 = document.getElementById("hero-title");
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".card", { y: 46, autoAlpha: 0, duration: 0.9 });
  if (window.SplitText && h1) {
    const split = SplitText.create(h1, { type: "chars" });
    tl.from(split.chars, { y: 34, autoAlpha: 0, duration: 0.6, stagger: 0.035 }, "-=0.5");
  }
  tl.from(".plate", {
    x: (i, el) => (el.dataset.from === "left" ? -1 : 1) * Math.min(window.innerWidth * 0.35, 520),
    y: 30, rotation: (i, el) => (el.dataset.from === "left" ? -16 : 16), autoAlpha: 0,
    duration: 1.1, stagger: 0.12, ease: "power4.out",
  }, "-=0.7");
  tl.from(".card .greet, .card .facts li, .card .lede, .card .langs, .card-stub > *", {
    y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.07,
  }, "-=1");
  if (xmas && !xmas.hidden) tl.from(xmas, { yPercent: -100, autoAlpha: 0, duration: 0.6 }, "-=0.4");
  tl.add(() => { startCycle(); enableTilt(); setInterval(swapPlate, 3200); }, "+=0.8");

  const mm = gsap.matchMedia();

  // Leaving the hero on a wide screen, the plates drift apart and the card settles.
  mm.add("(min-width: 1100px)", () => {
    gsap.to(".plate", {
      yPercent: i => [-24, 18, -18, 26][i] || 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".card", { scale: 0.95, yPercent: 4, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });

  // The evening: pinned on a tall wide screen, lighting row by row; elsewhere each row lights as it arrives.
  if (night) {
    mm.add("(min-width: 1100px) and (min-height: 800px)", () => {
      night.classList.add("is-story");
      light(0);
      ScrollTrigger.create({
        trigger: night, start: "center center", end: () => "+=" + Math.round(window.innerHeight * 1.3),
        pin: true, scrub: true, onUpdate: s => light(s.progress), onLeave: () => light(1),
      });
      return () => { night.classList.remove("is-story"); rows.forEach(r => r.classList.remove("is-lit")); showStep(0); };
    });
    mm.add("(max-width: 1099px), (max-height: 799px)", () => {
      night.classList.add("is-story");
      rows.forEach(r => ScrollTrigger.create({
        trigger: r, start: "top 80%", once: true,
        onEnter: () => { r.classList.add("is-lit"); showStep(+r.dataset.step); },
      }));
      return () => night.classList.remove("is-story");
    });
  }

  // Headings rise line by line once the fonts are in; the split is undone afterwards so a language change can rewrite them.
  const riseHeadings = () => {
    if (!window.SplitText) return;
    document.querySelectorAll("[data-split]").forEach(el => {
      const split = SplitText.create(el, { type: "lines" });
      splits.set(el, split);
      gsap.from(split.lines, {
        y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onComplete: () => { if (splits.get(el) === split) { split.revert(); splits.delete(el); } },
      });
    });
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(riseHeadings); else riseHeadings();

  gsap.utils.toArray("[data-rise]").forEach(el => {
    gsap.from(el, { y: 28, autoAlpha: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // The menus: the giant word, the bars one after another, the card tipped onto the table.
  gsap.from(".giant", { x: -40, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: ".giant", start: "top 95%", once: true } });
  gsap.from(".tabs [role='tab']", { x: -26, autoAlpha: 0, duration: 0.5, stagger: 0.06, scrollTrigger: { trigger: ".tabs", start: "top 85%", once: true } });
  gsap.from(".menu-card", { y: 50, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: ".menu-card", start: "top 85%", once: true } });

  // Meet Chef Romane: the portrait is laid down like a print; the promise is marked as you read it.
  gsap.from(".meet-photo", { rotation: -7, y: 50, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".meet", start: "top 75%", once: true } });
  const letter = document.querySelector(".letter");
  if (letter) ScrollTrigger.create({ trigger: letter, start: "top 60%", once: true, onEnter: () => letter.classList.add("is-in") });

  // The guest book: the entries arrive one by one, the numbers roll.
  gsap.from(".entry", { y: 26, autoAlpha: 0, duration: 0.7, stagger: 0.14, scrollTrigger: { trigger: ".book-page", start: "top 80%", once: true } });
  document.querySelectorAll("[data-count]").forEach(count);

  // The booking card is dealt onto the photo.
  gsap.from(".visit-card", { rotation: 2.5, y: 60, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".visit", start: "top 70%", once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
