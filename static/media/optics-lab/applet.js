/* Strahlenoptik — a small optics lab to play with.
 *
 * Five stations, each one picture you can take hold of: light and shadow,
 * mirrors, refraction, the focal point of a lens, and an optical bench with a
 * light source, an object, a lens on a rail and a projection screen. Every
 * station carries a short explanation and a few tasks that check themselves,
 * so a child can work through it without a grown-up standing by.
 *
 * Mounted on <div class="olab"></div>. Nothing is loaded from the network:
 * the whole lab is this one file. Progress lives in localStorage.
 *
 * The model is in centimetres and degrees. The view maps centimetres to CSS
 * pixels at draw time, so marks and labels keep their size on any screen and
 * the physics never learns that a screen exists. Angles are measured from the
 * normal, the way a schoolbook measures them.
 *
 * Four languages: German, English, Spanish, French.
 */
(function () {
  "use strict";

  var LANGS = ["de", "en", "es", "fr"];
  var LANG_KEY = "lang";                 // shared with the other applets
  var STORE_KEY = "olab.solved.v1";
  var GRAB_PX = 22;                      // how near a handle counts as grabbed
  var N = { air: 1.0, water: 1.33, glass: 1.5 };

  // ------------------------------------------------------------------ text

  var TEXT = {
    de: {
      name: "Strahlenoptik",
      station: "Station",
      tasks: "Aufgaben",
      solved: "%a von %b gelöst",
      reset: "Aufgaben zurücksetzen",
      resetAsk: "Alle gelösten Aufgaben zurücksetzen?",
      hit: "Gelöst!",
      allDone: "Alle Aufgaben dieser Station sind gelöst. Stark!",
      find: "Finde",
      look: "Schau nach",
      help: "Zieh die dicken Punkte mit der Maus oder dem Finger. Die Regler "
        + "darunter tun dasselbe und gehen auch mit der Tastatur.",
      w: {
        lamp: "Lampe", object: "Gegenstand", wall: "Wand", screen: "Schirm",
        mirror: "Spiegel", normal: "Lot", target: "Ziel", image: "Bild",
        lens: "Linse", focus: "Brennpunkt", air: "Luft", water: "Wasser",
        glass: "Glas", total: "Totalreflexion", sharp: "scharf",
        blurred: "unscharf", real: "reell", virtual: "virtuell",
        upright: "aufrecht", inverted: "umgekehrt", bigger: "größer",
        smaller: "kleiner", same: "gleich groß", none: "keiner",
        top: "von oben", bot: "von unten", conv: "Sammellinse",
        div: "Zerstreuungslinse"
      },
      st: {
        shadow: {
          name: "Licht & Schatten",
          head: "Licht läuft geradeaus.",
          lead: "Licht biegt nicht um Ecken. Es läuft in geraden Strahlen, und "
            + "was im Weg steht, lässt an der Wand einen Schatten übrig: genau "
            + "den Teil der Wand, zu dem kein Strahl mehr kommt. Schieb die "
            + "Lampe näher an den Gegenstand. Der Gegenstand bleibt gleich "
            + "groß, der Schatten wird größer.",
          ctl: { lampX: "Lampe vor und zurück", lampY: "Lampe hoch und runter",
                 objX: "Gegenstand", wallX: "Wand", two: "Zweite Lampe" },
          out: { ratio: "Schatten", pen: "Halbschatten" },
          tasks: {
            a: "Mach den Schatten genau so groß wie den Gegenstand.",
            b: "Mach den Schatten doppelt so groß wie den Gegenstand.",
            c: "Schalte die zweite Lampe ein und stell einen Kernschatten mit "
              + "Halbschatten auf beiden Seiten ein."
          }
        },
        mirror: {
          name: "Spiegel",
          head: "Einfallswinkel = Ausfallswinkel.",
          lead: "Ein Spiegel wirft das Licht zurück, und zwar nach einer sehr "
            + "einfachen Regel. Man zeichnet das Lot — die Linie senkrecht zum "
            + "Spiegel — und misst den Winkel dazu. Der Strahl kommt mit dem "
            + "gleichen Winkel wieder weg, auf der anderen Seite des Lots. "
            + "Das Spiegelbild der Lampe liegt genau so weit hinter dem "
            + "Spiegel, wie die Lampe davor steht.",
          ctl: { aim: "Wohin auf den Spiegel", tilt: "Spiegel drehen",
                 ghost: "Spiegelbild zeigen" },
          out: { ang: "Einfallswinkel", miss: "Abstand zum Ziel" },
          tasks: {
            a: "Triff mit dem zurückgeworfenen Strahl das Ziel.",
            b: "Stell den Einfallswinkel auf 45° ein. Dann knickt der Strahl "
              + "um genau 90°.",
            c: "Stell Spiegel und Zielpunkt so ein, dass der Strahl genau zur "
              + "Lampe zurückläuft.",
            d: "Lass das Spiegelbild zeigen. Der zurückgeworfene Strahl kommt "
              + "genau von dort."
          }
        },
        refract: {
          name: "Brechung",
          head: "Am Übergang knickt das Licht.",
          lead: "In Wasser und in Glas ist das Licht langsamer als in Luft. "
            + "Darum knickt ein schräger Strahl an der Grenze um: hinein geht "
            + "er zum Lot hin, heraus vom Lot weg. Und heraus geht es nicht "
            + "immer. Ab einem bestimmten Winkel bleibt alles Licht im Wasser "
            + "— das ist die Totalreflexion, und der Winkel heißt Grenzwinkel.",
          ctl: { ang: "Winkel zum Lot", mat: "Unten ist", from: "Strahl kommt" },
          out: { a1: "Einfallswinkel", a2: "Brechungswinkel",
                 crit: "Grenzwinkel" },
          tasks: {
            a: "Lass den Strahl aus der Luft ins Wasser laufen und zum Lot hin "
              + "knicken.",
            b: "Schick den Strahl von unten und finde den Grenzwinkel, ab dem "
              + "kein Licht mehr hinauskommt.",
            c: "Knick den Strahl um mehr als 20°."
          }
        },
        lens: {
          name: "Brennpunkt",
          head: "Eine Sammellinse holt die Sonne in einen Punkt.",
          lead: "Licht von weit weg — von der Sonne zum Beispiel — kommt in "
            + "lauter parallelen Strahlen an. Eine Sammellinse knickt sie alle "
            + "so, dass sie sich in einem Punkt treffen: im Brennpunkt. Wie "
            + "weit der von der Linse weg liegt, ist die Brennweite. Eine "
            + "Zerstreuungslinse macht das Gegenteil, sie fächert das Licht "
            + "auf.",
          ctl: { f: "Brennweite", tilt: "Licht kommt schräg",
                 kind: "Linse" },
          out: { f: "Brennweite", meet: "Treffpunkt" },
          tasks: {
            a: "Stell die Brennweite so ein, dass die Strahlen genau im roten "
              + "Punkt zusammenlaufen.",
            b: "Kipp das Lichtbündel und treffe damit den zweiten Punkt neben "
              + "der Achse.",
            c: "Schalte auf die Zerstreuungslinse. Die Strahlen laufen "
              + "auseinander; ihr Brennpunkt liegt vor der Linse und ist nur "
              + "gedacht."
          }
        },
        bench: {
          name: "Optisches Labor",
          head: "Linsenschiene, Gegenstand, Linse, Projektionswand.",
          lead: "Jetzt alles zusammen. Links leuchtet die Lampe durch einen "
            + "Gegenstand, in der Mitte sitzt die Linse auf der Schiene, "
            + "rechts steht die Projektionswand. Drei Strahlen reichen, um das "
            + "Bild zu finden: einer parallel zur Achse, der hinter der Linse "
            + "durch den Brennpunkt geht; einer durch die Mitte der Linse, der "
            + "gar nicht knickt; und einer durch den vorderen Brennpunkt, der "
            + "hinter der Linse parallel weiterläuft. Wo sie sich treffen, ist "
            + "das Bild.",
          ctl: { objX: "Gegenstand", lensX: "Linse", scrX: "Projektionswand",
                 f: "Brennweite", objH: "Größe des Gegenstands" },
          out: { g: "Gegenstandsweite g", b: "Bildweite b", m: "Bild ist",
                 law: "1/f = 1/g + 1/b", kind: "Bild" },
          tasks: {
            a: "Stell die Projektionswand so, dass das Bild scharf ist.",
            b: "Mach das Bild genau so groß wie den Gegenstand, und scharf.",
            c: "Mach das Bild doppelt so groß wie den Gegenstand, und scharf.",
            d: "Mach das Bild kleiner als den Gegenstand, und scharf. So "
              + "arbeitet eine Kamera.",
            e: "Schieb den Gegenstand näher an die Linse als die Brennweite, "
              + "bis das gedachte Bild doppelt so groß ist. Auf der Wand "
              + "kommt dann nichts mehr an — so arbeitet eine Lupe."
          }
        }
      }
    },

    en: {
      name: "Ray optics",
      station: "Station",
      tasks: "Tasks",
      solved: "%a of %b solved",
      reset: "Clear tasks",
      resetAsk: "Clear all solved tasks?",
      hit: "Solved!",
      allDone: "Every task at this station is solved. Well done!",
      find: "Find",
      look: "Have a look",
      help: "Drag the fat dots with the mouse or your finger. The sliders "
        + "below do the same thing and work with the keyboard too.",
      w: {
        lamp: "lamp", object: "object", wall: "wall", screen: "screen",
        mirror: "mirror", normal: "normal", target: "target", image: "image",
        lens: "lens", focus: "focal point", air: "air", water: "water",
        glass: "glass", total: "total reflection", sharp: "sharp",
        blurred: "blurred", real: "real", virtual: "virtual",
        upright: "upright", inverted: "upside down", bigger: "bigger",
        smaller: "smaller", same: "the same size", none: "none",
        top: "from above", bot: "from below", conv: "converging",
        div: "diverging"
      },
      st: {
        shadow: {
          name: "Light & shadow",
          head: "Light travels in straight lines.",
          lead: "Light does not go round corners. It travels in straight rays, "
            + "and whatever stands in the way leaves a shadow on the wall: "
            + "exactly the part of the wall no ray reaches any more. Push the "
            + "lamp closer to the object. The object stays the same size and "
            + "the shadow grows.",
          ctl: { lampX: "Lamp nearer and further", lampY: "Lamp up and down",
                 objX: "Object", wallX: "Wall", two: "Second lamp" },
          out: { ratio: "Shadow", pen: "Half shadow" },
          tasks: {
            a: "Make the shadow exactly the same size as the object.",
            b: "Make the shadow twice the size of the object.",
            c: "Switch the second lamp on and set up a full shadow with a half "
              + "shadow on both sides of it."
          }
        },
        mirror: {
          name: "Mirrors",
          head: "Angle in equals angle out.",
          lead: "A mirror throws the light back, and it follows a very simple "
            + "rule. Draw the normal — the line at right angles to the mirror "
            + "— and measure the angle to it. The ray leaves at the same "
            + "angle, on the other side of the normal. The mirror image of the "
            + "lamp sits exactly as far behind the mirror as the lamp stands "
            + "in front of it.",
          ctl: { aim: "Where on the mirror", tilt: "Turn the mirror",
                 ghost: "Show the mirror image" },
          out: { ang: "Angle in", miss: "Distance to the target" },
          tasks: {
            a: "Hit the target with the reflected ray.",
            b: "Set the angle in to 45°. The ray then turns by exactly 90°.",
            c: "Set the mirror and the aim so the ray goes straight back to "
              + "the lamp.",
            d: "Switch the mirror image on. The reflected ray comes from "
              + "exactly there."
          }
        },
        refract: {
          name: "Refraction",
          head: "Light bends at the boundary.",
          lead: "Light is slower in water and in glass than it is in air. So a "
            + "slanted ray bends where it crosses: going in it bends towards "
            + "the normal, coming out it bends away from it. And it does not "
            + "always come out. Past a certain angle all the light stays in "
            + "the water. That is total reflection, and the angle is called "
            + "the critical angle.",
          ctl: { ang: "Angle to the normal", mat: "Below is",
                 from: "Ray comes from" },
          out: { a1: "Angle in", a2: "Angle of refraction",
                 crit: "Critical angle" },
          tasks: {
            a: "Send the ray from the air into the water and make it bend "
              + "towards the normal.",
            b: "Send the ray up from below and find the critical angle, where "
              + "no light gets out any more.",
            c: "Bend the ray by more than 20°."
          }
        },
        lens: {
          name: "Focal point",
          head: "A converging lens gathers the sun into one point.",
          lead: "Light from far away — from the sun, for instance — arrives as "
            + "a bundle of parallel rays. A converging lens bends them all so "
            + "that they meet in a single point: the focal point. How far that "
            + "point sits from the lens is the focal length. A diverging lens "
            + "does the opposite and fans the light out.",
          ctl: { f: "Focal length", tilt: "Light arrives at an angle",
                 kind: "Lens" },
          out: { f: "Focal length", meet: "They meet" },
          tasks: {
            a: "Set the focal length so the rays meet exactly in the red dot.",
            b: "Tilt the bundle of light and hit the second dot, the one off "
              + "the axis.",
            c: "Switch to the diverging lens. The rays spread apart; their "
              + "focal point lies in front of the lens and is only imagined."
          }
        },
        bench: {
          name: "Optics bench",
          head: "Rail, object, lens, projection screen.",
          lead: "Now all of it together. On the left the lamp shines through an "
            + "object, in the middle the lens sits on the rail, on the right "
            + "stands the projection screen. Three rays are enough to find the "
            + "image: one parallel to the axis, which passes through the focal "
            + "point behind the lens; one through the centre of the lens, "
            + "which does not bend at all; and one through the focal point in "
            + "front, which carries on parallel behind the lens. Where they "
            + "meet is the image.",
          ctl: { objX: "Object", lensX: "Lens", scrX: "Projection screen",
                 f: "Focal length", objH: "Size of the object" },
          out: { g: "Object distance g", b: "Image distance b", m: "Image is",
                 law: "1/f = 1/g + 1/b", kind: "Image" },
          tasks: {
            a: "Move the screen so the image is sharp.",
            b: "Make the image exactly the same size as the object, and sharp.",
            c: "Make the image twice the size of the object, and sharp.",
            d: "Make the image smaller than the object, and sharp. That is how "
              + "a camera works.",
            e: "Push the object closer to the lens than the focal length, "
              + "until the imagined image is twice the size. Nothing arrives "
              + "on the screen any more. That is how a magnifier works."
          }
        }
      }
    },

    es: {
      name: "Óptica geométrica",
      station: "Estación",
      tasks: "Tareas",
      solved: "%a de %b resueltas",
      reset: "Borrar las tareas",
      resetAsk: "¿Borrar todas las tareas resueltas?",
      hit: "¡Resuelta!",
      allDone: "Todas las tareas de esta estación están resueltas. ¡Muy bien!",
      find: "Encuentra",
      look: "Observa",
      help: "Arrastra los puntos gruesos con el ratón o con el dedo. Los "
        + "controles de abajo hacen lo mismo y también funcionan con el "
        + "teclado.",
      w: {
        lamp: "lámpara", object: "objeto", wall: "pared", screen: "pantalla",
        mirror: "espejo", normal: "normal", target: "diana", image: "imagen",
        lens: "lente", focus: "foco", air: "aire", water: "agua",
        glass: "vidrio", total: "reflexión total", sharp: "nítida",
        blurred: "borrosa", real: "real", virtual: "virtual",
        upright: "derecha", inverted: "invertida", bigger: "más grande",
        smaller: "más pequeña", same: "del mismo tamaño", none: "ninguna",
        top: "de arriba", bot: "de abajo", conv: "convergente",
        div: "divergente"
      },
      st: {
        shadow: {
          name: "Luz y sombra",
          head: "La luz viaja en línea recta.",
          lead: "La luz no da la vuelta a las esquinas. Viaja en rayos rectos, "
            + "y lo que se pone en medio deja una sombra en la pared: justo la "
            + "parte de la pared a la que ya no llega ningún rayo. Acerca la "
            + "lámpara al objeto. El objeto sigue igual de grande y la sombra "
            + "crece.",
          ctl: { lampX: "Lámpara más cerca y más lejos",
                 lampY: "Lámpara arriba y abajo", objX: "Objeto",
                 wallX: "Pared", two: "Segunda lámpara" },
          out: { ratio: "Sombra", pen: "Penumbra" },
          tasks: {
            a: "Haz que la sombra sea exactamente del mismo tamaño que el "
              + "objeto.",
            b: "Haz que la sombra sea el doble que el objeto.",
            c: "Enciende la segunda lámpara y consigue una sombra plena con "
              + "penumbra a los dos lados."
          }
        },
        mirror: {
          name: "Espejos",
          head: "El ángulo de entrada es igual al de salida.",
          lead: "Un espejo devuelve la luz, y lo hace con una regla muy "
            + "sencilla. Se dibuja la normal — la línea perpendicular al "
            + "espejo — y se mide el ángulo con ella. El rayo sale con el "
            + "mismo ángulo, al otro lado de la normal. La imagen de la "
            + "lámpara está justo tan lejos por detrás del espejo como la "
            + "lámpara por delante.",
          ctl: { aim: "Dónde en el espejo", tilt: "Girar el espejo",
                 ghost: "Mostrar la imagen" },
          out: { ang: "Ángulo de entrada", miss: "Distancia a la diana" },
          tasks: {
            a: "Da en la diana con el rayo reflejado.",
            b: "Pon el ángulo de entrada en 45°. Así el rayo gira exactamente "
              + "90°.",
            c: "Ajusta el espejo y el punto de incidencia para que el rayo "
              + "vuelva justo a la lámpara.",
            d: "Muestra la imagen del espejo. El rayo reflejado viene justo de "
              + "ahí."
          }
        },
        refract: {
          name: "Refracción",
          head: "La luz se dobla en la frontera.",
          lead: "En el agua y en el vidrio la luz va más despacio que en el "
            + "aire. Por eso un rayo inclinado se dobla al cruzar: al entrar "
            + "se acerca a la normal, al salir se aleja de ella. Y no siempre "
            + "sale. Pasado un cierto ángulo toda la luz se queda en el agua. "
            + "Eso es la reflexión total, y el ángulo se llama ángulo límite.",
          ctl: { ang: "Ángulo con la normal", mat: "Abajo hay",
                 from: "El rayo viene" },
          out: { a1: "Ángulo de entrada", a2: "Ángulo de refracción",
                 crit: "Ángulo límite" },
          tasks: {
            a: "Manda el rayo del aire al agua y haz que se acerque a la "
              + "normal.",
            b: "Manda el rayo desde abajo y encuentra el ángulo límite, donde "
              + "ya no sale luz.",
            c: "Dobla el rayo más de 20°."
          }
        },
        lens: {
          name: "Punto focal",
          head: "Una lente convergente reúne el sol en un punto.",
          lead: "La luz que viene de lejos — del sol, por ejemplo — llega como "
            + "un haz de rayos paralelos. Una lente convergente los dobla "
            + "todos de modo que se reúnen en un solo punto: el foco. Lo lejos "
            + "que está ese punto de la lente es la distancia focal. Una lente "
            + "divergente hace lo contrario y abre la luz en abanico.",
          ctl: { f: "Distancia focal", tilt: "La luz llega inclinada",
                 kind: "Lente" },
          out: { f: "Distancia focal", meet: "Se reúnen" },
          tasks: {
            a: "Ajusta la distancia focal para que los rayos se reúnan justo "
              + "en el punto rojo.",
            b: "Inclina el haz y da con él en el segundo punto, el que está "
              + "fuera del eje.",
            c: "Cambia a la lente divergente. Los rayos se separan; su foco "
              + "queda delante de la lente y solo es imaginario."
          }
        },
        bench: {
          name: "Banco óptico",
          head: "Riel, objeto, lente, pantalla de proyección.",
          lead: "Ahora todo junto. A la izquierda la lámpara ilumina un "
            + "objeto, en el medio la lente va sobre el riel, a la derecha "
            + "está la pantalla de proyección. Bastan tres rayos para "
            + "encontrar la imagen: uno paralelo al eje, que pasa por el foco "
            + "de detrás de la lente; uno por el centro de la lente, que no se "
            + "dobla nada; y uno por el foco de delante, que sigue paralelo "
            + "detrás de la lente. Donde se cruzan está la imagen.",
          ctl: { objX: "Objeto", lensX: "Lente", scrX: "Pantalla",
                 f: "Distancia focal", objH: "Tamaño del objeto" },
          out: { g: "Distancia del objeto g", b: "Distancia de la imagen b",
                 m: "La imagen es", law: "1/f = 1/g + 1/b", kind: "Imagen" },
          tasks: {
            a: "Mueve la pantalla hasta que la imagen sea nítida.",
            b: "Haz la imagen exactamente del mismo tamaño que el objeto, y "
              + "nítida.",
            c: "Haz la imagen el doble que el objeto, y nítida.",
            d: "Haz la imagen más pequeña que el objeto, y nítida. Así "
              + "funciona una cámara.",
            e: "Acerca el objeto a la lente más que la distancia focal, hasta "
              + "que la imagen imaginaria sea el doble. A la pantalla ya no "
              + "llega nada. Así funciona una lupa."
          }
        }
      }
    },

    fr: {
      name: "Optique géométrique",
      station: "Station",
      tasks: "Défis",
      solved: "%a sur %b résolus",
      reset: "Effacer les défis",
      resetAsk: "Effacer tous les défis résolus ?",
      hit: "Résolu !",
      allDone: "Tous les défis de cette station sont résolus. Bravo !",
      find: "Trouve",
      look: "Observe",
      help: "Fais glisser les gros points avec la souris ou le doigt. Les "
        + "curseurs en dessous font la même chose et marchent aussi au "
        + "clavier.",
      w: {
        lamp: "lampe", object: "objet", wall: "mur", screen: "écran",
        mirror: "miroir", normal: "normale", target: "cible", image: "image",
        lens: "lentille", focus: "foyer", air: "air", water: "eau",
        glass: "verre", total: "réflexion totale", sharp: "nette",
        blurred: "floue", real: "réelle", virtual: "virtuelle",
        upright: "droite", inverted: "renversée", bigger: "plus grande",
        smaller: "plus petite", same: "de la même taille", none: "aucun",
        top: "d'en haut", bot: "d'en bas", conv: "convergente",
        div: "divergente"
      },
      st: {
        shadow: {
          name: "Lumière et ombre",
          head: "La lumière va tout droit.",
          lead: "La lumière ne tourne pas les coins. Elle va en rayons droits, "
            + "et ce qui se met en travers laisse une ombre sur le mur : "
            + "exactement la partie du mur qu'aucun rayon n'atteint plus. "
            + "Approche la lampe de l'objet. L'objet garde sa taille et "
            + "l'ombre grandit.",
          ctl: { lampX: "Lampe plus près, plus loin",
                 lampY: "Lampe en haut, en bas", objX: "Objet", wallX: "Mur",
                 two: "Deuxième lampe" },
          out: { ratio: "Ombre", pen: "Pénombre" },
          tasks: {
            a: "Fais une ombre exactement de la taille de l'objet.",
            b: "Fais une ombre deux fois plus grande que l'objet.",
            c: "Allume la deuxième lampe et obtiens une ombre pleine avec une "
              + "pénombre des deux côtés."
          }
        },
        mirror: {
          name: "Miroirs",
          head: "Angle d'entrée = angle de sortie.",
          lead: "Un miroir renvoie la lumière, et il suit une règle très "
            + "simple. On trace la normale — la ligne perpendiculaire au "
            + "miroir — et on mesure l'angle avec elle. Le rayon repart avec "
            + "le même angle, de l'autre côté de la normale. L'image de la "
            + "lampe se trouve exactement aussi loin derrière le miroir que la "
            + "lampe devant.",
          ctl: { aim: "Où sur le miroir", tilt: "Tourner le miroir",
                 ghost: "Montrer l'image" },
          out: { ang: "Angle d'entrée", miss: "Distance à la cible" },
          tasks: {
            a: "Atteins la cible avec le rayon renvoyé.",
            b: "Règle l'angle d'entrée sur 45°. Le rayon tourne alors "
              + "d'exactement 90°.",
            c: "Règle le miroir et le point de visée pour que le rayon "
              + "revienne juste sur la lampe.",
            d: "Montre l'image dans le miroir. Le rayon renvoyé vient "
              + "exactement de là."
          }
        },
        refract: {
          name: "Réfraction",
          head: "La lumière se casse à la frontière.",
          lead: "Dans l'eau et dans le verre la lumière va moins vite que dans "
            + "l'air. Un rayon oblique se casse donc à la frontière : en "
            + "entrant il se rapproche de la normale, en sortant il s'en "
            + "éloigne. Et il ne sort pas toujours. Au-delà d'un certain angle "
            + "toute la lumière reste dans l'eau. C'est la réflexion totale, "
            + "et cet angle s'appelle l'angle limite.",
          ctl: { ang: "Angle avec la normale", mat: "En bas il y a",
                 from: "Le rayon vient" },
          out: { a1: "Angle d'entrée", a2: "Angle de réfraction",
                 crit: "Angle limite" },
          tasks: {
            a: "Envoie le rayon de l'air dans l'eau et fais-le se rapprocher "
              + "de la normale.",
            b: "Envoie le rayon par le bas et trouve l'angle limite, celui où "
              + "plus aucune lumière ne sort.",
            c: "Casse le rayon de plus de 20°."
          }
        },
        lens: {
          name: "Foyer",
          head: "Une lentille convergente ramasse le soleil en un point.",
          lead: "La lumière qui vient de loin — du soleil par exemple — arrive "
            + "en faisceau de rayons parallèles. Une lentille convergente les "
            + "casse tous pour qu'ils se retrouvent en un seul point : le "
            + "foyer. La distance du foyer à la lentille est la distance "
            + "focale. Une lentille divergente fait le contraire et ouvre la "
            + "lumière en éventail.",
          ctl: { f: "Distance focale", tilt: "La lumière arrive de biais",
                 kind: "Lentille" },
          out: { f: "Distance focale", meet: "Ils se retrouvent" },
          tasks: {
            a: "Règle la distance focale pour que les rayons se retrouvent "
              + "juste dans le point rouge.",
            b: "Incline le faisceau et atteins le deuxième point, celui qui "
              + "est hors de l'axe.",
            c: "Passe à la lentille divergente. Les rayons s'écartent ; leur "
              + "foyer est devant la lentille et il n'est qu'imaginé."
          }
        },
        bench: {
          name: "Banc d'optique",
          head: "Rail, objet, lentille, écran de projection.",
          lead: "Maintenant tout ensemble. À gauche la lampe éclaire un objet, "
            + "au milieu la lentille est posée sur le rail, à droite se tient "
            + "l'écran de projection. Trois rayons suffisent pour trouver "
            + "l'image : un parallèle à l'axe, qui passe par le foyer derrière "
            + "la lentille ; un par le centre de la lentille, qui ne se casse "
            + "pas du tout ; et un par le foyer de devant, qui repart "
            + "parallèle derrière la lentille. Là où ils se croisent se trouve "
            + "l'image.",
          ctl: { objX: "Objet", lensX: "Lentille", scrX: "Écran",
                 f: "Distance focale", objH: "Taille de l'objet" },
          out: { g: "Distance de l'objet g", b: "Distance de l'image b",
                 m: "L'image est", law: "1/f = 1/g + 1/b", kind: "Image" },
          tasks: {
            a: "Déplace l'écran pour que l'image soit nette.",
            b: "Fais une image exactement de la taille de l'objet, et nette.",
            c: "Fais une image deux fois plus grande que l'objet, et nette.",
            d: "Fais une image plus petite que l'objet, et nette. C'est ainsi "
              + "que marche un appareil photo.",
            e: "Approche l'objet de la lentille plus près que la distance "
              + "focale, jusqu'à ce que l'image imaginée soit deux fois plus "
              + "grande. Rien n'arrive plus sur l'écran — c'est ainsi que "
              + "marche une loupe."
          }
        }
      }
    }
  };

  // ------------------------------------------------------------------- CSS

  var CSS = [
    ".olab{border:1px solid var(--rule,#ccc);border-radius:12px;padding:1rem 1.1rem 1.2rem;margin:1.6rem 0;background:var(--surface,#fff)}",
    ".olab__bar{display:flex;flex-wrap:wrap;gap:0.5rem 1rem;align-items:center;margin:0 0 0.8rem}",
    ".olab__group{display:flex;flex-wrap:wrap;gap:0.3rem;align-items:center}",
    ".olab__glabel{font-size:0.78em;letter-spacing:0.04em;text-transform:uppercase;color:var(--muted,#777)}",
    ".olab__opt{border:1px solid var(--rule-strong,#bbb);background:transparent;color:var(--ink,#222);border-radius:999px;padding:0.22rem 0.7rem;font:inherit;font-size:0.84em;cursor:pointer}",
    ".olab__opt:hover{border-color:var(--accent,#b4620e)}",
    ".olab__opt[aria-pressed=true]{background:var(--accent-wash,#f7ead9);border-color:var(--accent,#b4620e);color:var(--accent,#b4620e);font-weight:600}",
    ".olab__spacer{flex:1 1 auto}",
    ".olab__score{font-size:0.84em;color:var(--muted,#666);white-space:nowrap}",
    ".olab__head{margin:0 0 0.3rem;font-size:1.05em;font-weight:600}",
    ".olab__lead{margin:0 0 0.8rem;font-size:0.95em;color:var(--ink-soft,#444)}",
    ".olab__stagewrap{position:relative;border:1px solid var(--rule,#ddd);border-radius:10px;overflow:hidden;background:#fdfcf8}",
    ".olab__stage{display:block;width:100%;height:auto;touch-action:none;user-select:none}",
    ".olab__stage:focus-visible{outline:3px solid var(--accent,#b4620e);outline-offset:-3px}",
    // Everything inside the stage is measured in CSS pixels, because the
    // viewBox is set to the element's pixel size on every layout. A stroke of
    // 2 is two pixels on any screen, and the centimetres live in the model.
    ".olab__axis{stroke:#9aa5b1;stroke-width:1;stroke-dasharray:6 5}",
    ".olab__ray{stroke:#e09b2d;stroke-width:2;fill:none;stroke-linecap:round}",
    ".olab__ray--main{stroke:#d4761a;stroke-width:2.6}",
    ".olab__ray--faint{stroke:#e09b2d;stroke-width:1.4;opacity:0.45}",
    ".olab__ray--ghost{stroke:#d4761a;stroke-width:1.6;stroke-dasharray:5 4;opacity:0.65;fill:none}",
    ".olab__normal{stroke:#5b6b7a;stroke-width:1.2;stroke-dasharray:4 4}",
    ".olab__body{fill:#2d3b48;stroke:none}",
    ".olab__wall{fill:#c3ccd4;stroke:#8e9aa6;stroke-width:1}",
    ".olab__rail{fill:#d8dde2;stroke:#aab4bd;stroke-width:1}",
    ".olab__post{stroke:#8e9aa6;stroke-width:2}",
    ".olab__umbra{fill:#2d3b48;opacity:0.82}",
    ".olab__penumbra{fill:#2d3b48;opacity:0.32}",
    ".olab__medium{stroke:#6d9dc5;stroke-width:1.5}",
    ".olab__water{fill:#cfe2f3}",
    ".olab__glass{fill:#dfe6ea}",
    ".olab__mirror{stroke:#4a5a68;stroke-width:4;stroke-linecap:round}",
    ".olab__mirrorback{stroke:#8e9aa6;stroke-width:1.2}",
    ".olab__lens{fill:#bfe0ef;fill-opacity:0.65;stroke:#3b7ea1;stroke-width:1.6}",
    ".olab__focus{fill:#3b7ea1}",
    ".olab__target{fill:none;stroke:#c0392b;stroke-width:2}",
    ".olab__targetdot{fill:#c0392b}",
    ".olab__image{stroke:#1e8e3e;stroke-width:2.6;fill:none;stroke-linecap:round}",
    ".olab__image--virtual{stroke-dasharray:6 4;stroke-width:2}",
    ".olab__spot{fill:#f2c572}",
    ".olab__lampbody{fill:#f6d58b;stroke:#d4761a;stroke-width:1.8}",
    ".olab__lampray{stroke:#e09b2d;stroke-width:1.8;stroke-linecap:round}",
    ".olab__lampbody--ghost{fill:none;stroke-dasharray:4 3;opacity:0.7}",
    ".olab__lampray--ghost{opacity:0.35}",
    ".olab__arrow{stroke:#2d3b48;stroke-width:2.8;fill:none;stroke-linecap:round;stroke-linejoin:round}",
    ".olab__arcline{fill:none}",
    ".olab__grab{fill:#b4620e;stroke:#fff;stroke-width:2;cursor:grab}",
    ".olab__grab:hover{fill:#8f4c09}",
    ".olab__label{font-family:var(--font-body,system-ui),sans-serif;font-size:12px;fill:#44525f;paint-order:stroke;stroke:#fdfcf8;stroke-width:3;stroke-linejoin:round}",
    ".olab__label--small{font-size:10.5px;fill:#6b7883}",
    ".olab__out{display:flex;flex-wrap:wrap;gap:0.3rem 0.5rem;margin:0.7rem 0 0}",
    ".olab__chip{font-size:0.82em;border:1px solid var(--rule,#ddd);border-radius:7px;padding:0.18rem 0.5rem;color:var(--ink-soft,#444);white-space:nowrap}",
    ".olab__chip--good{border-color:#1e8e3e;color:#1e8e3e;font-weight:600}",
    ".olab__chip--warn{border-color:#c0392b;color:#c0392b}",
    ".olab__ctls{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:0.5rem 1.1rem;margin:0.9rem 0 0}",
    ".olab__ctl{display:grid;gap:0.1rem}",
    ".olab__clabel{font-size:0.78em;color:var(--muted,#666)}",
    ".olab__range{width:100%;accent-color:var(--accent,#b4620e)}",
    ".olab__toggles{display:flex;flex-wrap:wrap;gap:0.3rem;align-items:center}",
    ".olab__say{margin:0.8rem 0 0;min-height:1.5em;font-size:0.95em}",
    ".olab__say--ok{color:#1e8e3e;font-weight:600}",
    ".olab__tasks{list-style:none;padding:0;margin:0.8rem 0 0;display:grid;gap:0.35rem}",
    ".olab__task{display:grid;grid-template-columns:1.5rem 1fr;gap:0.4rem;align-items:baseline;font-size:0.92em}",
    ".olab__tick{font-weight:700;color:var(--rule-strong,#bbb);text-align:center}",
    ".olab__task--done .olab__tick{color:#1e8e3e}",
    ".olab__task--done{color:var(--muted,#777)}",
    ".olab__kind{font-size:0.78em;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted,#888);margin-right:0.3rem}",
    ".olab__foot{display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;margin:0.9rem 0 0}",
    ".olab__help{margin:0.7rem 0 0;font-size:0.8em;color:var(--muted,#666)}",
    "@media (max-width:30rem){.olab{padding:0.8rem}.olab__lead{font-size:0.9em}}"
  ].join("");

  // -------------------------------------------------------------- plumbing

  function el(tag, cls, parent, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  function svgEl(tag, attrs, parent) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function clamp(value, lo, hi) {
    return value < lo ? lo : (value > hi ? hi : value);
  }

  function deg(radians) { return radians * 180 / Math.PI; }

  function rad(degrees) { return degrees * Math.PI / 180; }

  function round1(value) { return Math.round(value * 10) / 10; }

  /* Distance from a point to the half-line that starts at a and runs through
     b. Half-line, not segment: a reflected ray carries on past the picture. */
  function rayDistance(px, py, ax, ay, dx, dy) {
    var len = dx * dx + dy * dy;
    var t = len === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len;
    if (t < 0) t = 0;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(value) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(value));
    } catch (e) { /* private window, blocked storage: play on anyway */ }
  }

  function initialLang() {
    try {
      var stored = localStorage.getItem(LANG_KEY);
      if (LANGS.indexOf(stored) >= 0) return stored;
    } catch (e) { /* ignore */ }
    var tag = (navigator.language || "de").slice(0, 2);
    return LANGS.indexOf(tag) >= 0 ? tag : "de";
  }

  // -------------------------------------------------------------- stations

  /* A station is one picture with its own model, controls, drawing and tasks.
     The model is plain numbers in centimetres and degrees; nothing in it knows
     about pixels. `solve` turns the model into the quantities both the drawing
     and the task checks need, so a task can never disagree with the picture. */

  var SHADOW_H = 7;        // half height of the object, cm

  var SHADOW = {
    id: "shadow",
    span: 100,

    start: function () {
      // The second lamp starts level with the first, so switching it on
      // changes nothing until it is moved. That is the station's third task.
      return { lampX: 10, lampY: 0, objX: 46, wallX: 86, two: false,
               lamp2Y: 0 };
    },

    clamp: function (s) {
      s.lampX = clamp(s.lampX, 2, 34);
      s.lampY = clamp(s.lampY, -14, 14);
      s.wallX = clamp(s.wallX, 40, 95);
      s.objX = clamp(s.objX, s.lampX + 8, s.wallX - 0.5);
      s.lamp2Y = clamp(s.lamp2Y, -20, 20);
    },

    lamps: function (s) {
      var out = [[s.lampX, s.lampY]];
      if (s.two) out.push([s.lampX, s.lamp2Y]);
      return out;
    },

    solve: function (s) {
      var lamps = SHADOW.lamps(s);
      var k = (s.wallX - s.lampX) / (s.objX - s.lampX);
      var ivs = lamps.map(function (p) {
        return [p[1] + (-SHADOW_H - p[1]) * k, p[1] + (SHADOW_H - p[1]) * k];
      });
      var lo = Math.max.apply(null, ivs.map(function (iv) { return iv[0]; }));
      var hi = Math.min.apply(null, ivs.map(function (iv) { return iv[1]; }));
      var outerLo = Math.min.apply(null, ivs.map(function (iv) { return iv[0]; }));
      var outerHi = Math.max.apply(null, ivs.map(function (iv) { return iv[1]; }));
      var overlap = hi > lo;
      return { lamps: lamps, k: k, ivs: ivs, overlap: overlap,
               umbra: overlap ? [lo, hi] : null,
               outer: [outerLo, outerHi],
               penBot: overlap ? lo - outerLo : 0,
               penTop: overlap ? outerHi - hi : 0 };
    },

    ctls: function (s) {
      var list = [
        { key: "lampX", kind: "range", min: 2, max: 34, step: 0.5 },
        { key: "lampY", kind: "range", min: -14, max: 14, step: 0.5 },
        { key: "objX", kind: "range", min: 12, max: 95, step: 0.5 },
        { key: "wallX", kind: "range", min: 40, max: 95, step: 0.5 },
        { key: "two", kind: "switch" }
      ];
      if (s.two) {
        list.push({ key: "lamp2Y", kind: "range", min: -20, max: 20, step: 0.5 });
      }
      return list;
    },

    handles: function (s) {
      var list = [
        { x: s.lampX, y: s.lampY, free: "xy",
          set: function (st, x, y) { st.lampX = x; st.lampY = y; } },
        { x: s.objX, y: 0, free: "x",
          set: function (st, x) { st.objX = x; } },
        { x: s.wallX, y: 0, free: "x",
          set: function (st, x) { st.wallX = x; } }
      ];
      if (s.two) {
        list.push({ x: s.lampX, y: s.lamp2Y, free: "y",
                    set: function (st, x, y) { st.lamp2Y = y; } });
      }
      return list;
    },

    draw: function (lab, s, d, t) {
      var hy = lab.halfY;
      lab.rectLab("olab__wall", s.wallX, hy, 2.4, 2 * hy);

      // One ray per sample point on the wall, stopped where the object is in
      // the way. Drawing the rays rather than a shaded cone is the point of
      // the station: the shadow is where no ray arrives.
      d.lamps.forEach(function (p) {
        var n = 19;
        for (var i = 0; i < n; i += 1) {
          var yw = -hy * 0.94 + (2 * hy * 0.94) * i / (n - 1);
          var kx = (s.objX - p[0]) / (s.wallX - p[0]);
          var yo = p[1] + (yw - p[1]) * kx;
          if (Math.abs(yo) <= SHADOW_H) {
            lab.line("olab__ray olab__ray--faint", p[0], p[1], s.objX, yo);
          } else {
            lab.line("olab__ray", p[0], p[1], s.wallX, yw);
          }
        }
      });

      // The two edge rays, dashed, so the construction is visible.
      d.lamps.forEach(function (p) {
        [SHADOW_H, -SHADOW_H].forEach(function (edge) {
          var yw = p[1] + (edge - p[1]) * d.k;
          lab.line("olab__ray--ghost", s.objX, edge, s.wallX, yw);
        });
      });

      if (d.overlap) {
        lab.rectLab("olab__penumbra", s.wallX, d.outer[1], 2.4,
                    d.outer[1] - d.outer[0]);
        lab.rectLab("olab__umbra", s.wallX, d.umbra[1], 2.4,
                    d.umbra[1] - d.umbra[0]);
      } else {
        d.ivs.forEach(function (iv) {
          lab.rectLab("olab__umbra", s.wallX, iv[1], 2.4, iv[1] - iv[0]);
        });
      }

      lab.rectLab("olab__body", s.objX - 0.9, SHADOW_H, 1.8, 2 * SHADOW_H);
      d.lamps.forEach(function (p) { lab.lamp(p[0], p[1]); });

      lab.txt("olab__label", s.objX, SHADOW_H, t.w.object, "middle", 0, -8);
      lab.txt("olab__label", s.wallX, d.outer[1], t.w.wall, "end", -4, -8);
      lab.txt("olab__label", s.lampX, s.lampY, t.w.lamp, "middle", 0, 22);
    },

    out: function (s, d, t, st) {
      var rows = [[st.out.ratio, round1(d.k) + " × " + t.w.object]];
      if (s.two) {
        rows.push([st.out.pen, d.overlap
          ? round1(d.penTop) + " cm / " + round1(d.penBot) + " cm"
          : t.w.none]);
      }
      return rows;
    },

    tasks: [
      { id: "a", kind: "find", ok: function (s, d) { return d.k <= 1.05; } },
      { id: "b", kind: "find",
        ok: function (s, d) { return d.k >= 1.93 && d.k <= 2.07; } },
      { id: "c", kind: "find",
        ok: function (s, d) {
          return s.two && d.overlap && d.penTop > 0.4 && d.penBot > 0.4;
        } }
    ]
  };

  // The lamp's distance from the mirror centre is the radius of the circle its
  // mirror image moves on as the mirror turns. The stage is about 24 cm above
  // the axis at its widest, so that radius has to stay under it or the image
  // the station is about leaves the picture.
  var MIR_LAMP = [34, 14];
  var MIR_C = [50, 0];
  var MIR_L = 20;
  var MIR_TGT = [88, 12];

  var MIRROR = {
    id: "mirror",
    span: 100,

    start: function () { return { aim: 0, tilt: 0, ghost: false }; },

    clamp: function (s) {
      s.aim = clamp(s.aim, -1, 1);
      s.tilt = clamp(s.tilt, -45, 45);
    },

    solve: function (s) {
      var a = rad(s.tilt);
      var u = [Math.cos(a), Math.sin(a)];          // along the mirror
      var n = [-Math.sin(a), Math.cos(a)];         // the normal, front side up
      var p = [MIR_C[0] + s.aim * MIR_L * u[0],
               MIR_C[1] + s.aim * MIR_L * u[1]];
      var dx = p[0] - MIR_LAMP[0];
      var dy = p[1] - MIR_LAMP[1];
      var len = Math.hypot(dx, dy) || 1;
      var dir = [dx / len, dy / len];
      var dn = dir[0] * n[0] + dir[1] * n[1];
      var refl = [dir[0] - 2 * dn * n[0], dir[1] - 2 * dn * n[1]];
      var theta = deg(Math.acos(clamp(Math.abs(dn), -1, 1)));
      var miss = rayDistance(MIR_TGT[0], MIR_TGT[1], p[0], p[1],
                             refl[0], refl[1]);
      // The lamp seen in the mirror: reflect it in the mirror line.
      var v = [MIR_LAMP[0] - MIR_C[0], MIR_LAMP[1] - MIR_C[1]];
      var vu = v[0] * u[0] + v[1] * u[1];
      var ghost = [MIR_C[0] + 2 * vu * u[0] - v[0],
                   MIR_C[1] + 2 * vu * u[1] - v[1]];
      return { u: u, n: n, p: p, dir: dir, refl: refl, theta: theta,
               miss: miss, ghost: ghost, front: dn < 0 };
    },

    ctls: function () {
      return [
        { key: "aim", kind: "range", min: -1, max: 1, step: 0.01 },
        { key: "tilt", kind: "range", min: -45, max: 45, step: 0.5 },
        { key: "ghost", kind: "switch" }
      ];
    },

    handles: function (s, d) {
      return [
        { x: d.p[0], y: d.p[1], free: "xy",
          set: function (st, x, y) {
            var a = rad(st.tilt);
            st.aim = ((x - MIR_C[0]) * Math.cos(a)
                      + (y - MIR_C[1]) * Math.sin(a)) / MIR_L;
          } },
        { x: MIR_C[0] + MIR_L * d.u[0], y: MIR_C[1] + MIR_L * d.u[1],
          free: "xy",
          set: function (st, x, y) {
            st.tilt = deg(Math.atan2(y - MIR_C[1], x - MIR_C[0]));
          } }
      ];
    },

    draw: function (lab, s, d, t) {
      var a0 = [MIR_C[0] - MIR_L * d.u[0], MIR_C[1] - MIR_L * d.u[1]];
      var a1 = [MIR_C[0] + MIR_L * d.u[0], MIR_C[1] + MIR_L * d.u[1]];
      lab.line("olab__mirror", a0[0], a0[1], a1[0], a1[1]);
      for (var i = -5; i <= 5; i += 1) {                 // hatching behind it
        var q = [MIR_C[0] + (i / 5) * MIR_L * 0.92 * d.u[0],
                 MIR_C[1] + (i / 5) * MIR_L * 0.92 * d.u[1]];
        lab.line("olab__mirrorback", q[0], q[1],
                 q[0] - 2.6 * d.n[0] + 1.6 * d.u[0],
                 q[1] - 2.6 * d.n[1] + 1.6 * d.u[1]);
      }

      var nEnd = [d.p[0] + 16 * d.n[0], d.p[1] + 16 * d.n[1]];
      lab.line("olab__normal", d.p[0] - 5 * d.n[0], d.p[1] - 5 * d.n[1],
               nEnd[0], nEnd[1]);
      lab.txt("olab__label--small", nEnd[0], nEnd[1], t.w.normal, "middle", 0, -5);

      lab.line("olab__ray olab__ray--main", MIR_LAMP[0], MIR_LAMP[1],
               d.p[0], d.p[1]);
      var exit = lab.edge(d.p[0], d.p[1], d.refl[0], d.refl[1]);
      lab.line("olab__ray olab__ray--main", d.p[0], d.p[1], exit[0], exit[1]);

      if (s.ghost) {
        lab.lamp(d.ghost[0], d.ghost[1], true);
        lab.line("olab__ray--ghost", d.ghost[0], d.ghost[1], d.p[0], d.p[1]);
        lab.txt("olab__label--small", d.ghost[0], d.ghost[1],
                t.w.image, "middle", 0, 20);
      }

      // Two arcs between the normal and the rays, so the equal angles show.
      var an = Math.atan2(d.n[1], d.n[0]);
      var ai = Math.atan2(-d.dir[1], -d.dir[0]);
      var ar = Math.atan2(d.refl[1], d.refl[0]);
      lab.arc("olab__normal", d.p[0], d.p[1], 26, an, ai);
      lab.arc("olab__normal", d.p[0], d.p[1], 26, an, ar);

      lab.dot("olab__target", MIR_TGT[0], MIR_TGT[1], 10);
      lab.dot("olab__targetdot", MIR_TGT[0], MIR_TGT[1], 2.5);
      lab.txt("olab__label", MIR_TGT[0], MIR_TGT[1], t.w.target, "middle", 0, -14);
      lab.lamp(MIR_LAMP[0], MIR_LAMP[1]);
      lab.txt("olab__label", MIR_LAMP[0], MIR_LAMP[1], t.w.lamp, "middle", 0, 22);
      lab.txt("olab__label", MIR_C[0], MIR_C[1], t.w.mirror, "middle", 0, 26);
    },

    out: function (s, d, t, st) {
      return [[st.out.ang, round1(d.theta) + "°"],
              [st.out.miss, round1(d.miss) + " cm",
               d.miss <= 2.5 ? "good" : ""]];
    },

    tasks: [
      { id: "a", kind: "find",
        ok: function (s, d) { return d.front && d.miss <= 2.5; } },
      { id: "b", kind: "find",
        ok: function (s, d) { return d.front && Math.abs(d.theta - 45) <= 1.5; } },
      { id: "c", kind: "find",
        ok: function (s, d) { return d.front && d.theta <= 1.5; } },
      { id: "d", kind: "look", ok: function (s) { return !!s.ghost; } }
    ]
  };

  var REF_P = [50, 0];     // where the ray crosses the boundary
  var REF_R = 30;          // how long the drawn rays are, cm

  var REFRACT = {
    id: "refract",
    span: 100,

    start: function () { return { ang: 40, mat: "water", from: "top" }; },

    clamp: function (s) { s.ang = clamp(s.ang, 0, 85); },

    solve: function (s) {
      var dense = N[s.mat];
      var top = s.from === "top";
      var n1 = top ? N.air : dense;
      var n2 = top ? dense : N.air;
      var a = rad(s.ang);
      var dir = [Math.sin(a), top ? -Math.cos(a) : Math.cos(a)];
      var sin2 = (n1 / n2) * Math.sin(a);
      var total = sin2 > 1;
      var a2 = total ? null : Math.asin(sin2);
      var out = total ? null
        : [Math.sin(a2), top ? -Math.cos(a2) : Math.cos(a2)];
      return {
        n1: n1, n2: n2, top: top, dir: dir, total: total,
        theta2: total ? null : deg(a2), out: out,
        back: [dir[0], -dir[1]],
        crit: n1 > n2 ? deg(Math.asin(n2 / n1)) : null,
        bend: total ? null : Math.abs(s.ang - deg(a2))
      };
    },

    ctls: function () {
      return [
        { key: "ang", kind: "range", min: 0, max: 85, step: 0.5 },
        { key: "mat", kind: "toggle", opts: [["water", "water"], ["glass", "glass"]] },
        { key: "from", kind: "toggle", opts: [["top", "top"], ["bot", "bot"]] }
      ];
    },

    handles: function (s, d) {
      return [{ x: REF_P[0] - d.dir[0] * REF_R, y: REF_P[1] - d.dir[1] * REF_R,
                free: "xy",
                set: function (st, x, y) {
                  var dx = x - REF_P[0];
                  var dy = y - REF_P[1];
                  st.ang = st.from === "top" ? deg(Math.atan2(-dx, dy))
                                             : deg(Math.atan2(-dx, -dy));
                } }];
    },

    draw: function (lab, s, d, t) {
      var hy = lab.halfY;
      lab.rectLab(s.mat === "water" ? "olab__water" : "olab__glass",
                  0, 0, lab.span, hy);
      lab.line("olab__medium", 0, 0, lab.span, 0);
      lab.txt("olab__label", 4, hy * 0.72, t.w.air, "start", 0, 0);
      lab.txt("olab__label", 4, -hy * 0.78,
              t.w[s.mat] + "  n = " + String(N[s.mat]), "start", 0, 0);
      lab.txt("olab__label--small", lab.span - 4, hy * 0.72, "n = 1.00",
              "end", 0, 0);

      lab.line("olab__normal", REF_P[0], hy * 0.9, REF_P[0], -hy * 0.9);
      lab.txt("olab__label--small", REF_P[0], d.top ? hy * 0.9 : -hy * 0.9,
              t.w.normal, "middle", 0, d.top ? -4 : 12);

      lab.line("olab__ray olab__ray--main",
               REF_P[0] - d.dir[0] * REF_R, REF_P[1] - d.dir[1] * REF_R,
               REF_P[0], REF_P[1]);

      var backEnd = lab.edge(REF_P[0], REF_P[1], d.back[0], d.back[1]);
      lab.line(d.total ? "olab__ray olab__ray--main" : "olab__ray olab__ray--faint",
               REF_P[0], REF_P[1], backEnd[0], backEnd[1]);

      if (!d.total) {
        var outEnd = lab.edge(REF_P[0], REF_P[1], d.out[0], d.out[1]);
        lab.line("olab__ray olab__ray--main", REF_P[0], REF_P[1],
                 outEnd[0], outEnd[1]);
      } else {
        lab.txt("olab__label", REF_P[0] + 14, d.top ? 8 : -8, t.w.total,
                "start", 0, 0);
      }

      // Where the critical angle sits, for the station's second task.
      if (d.crit !== null) {
        var ac = rad(d.crit);
        var cd = [Math.sin(ac), d.top ? -Math.cos(ac) : Math.cos(ac)];
        lab.line("olab__normal", REF_P[0], REF_P[1],
                 REF_P[0] - cd[0] * REF_R * 0.8,
                 REF_P[1] - cd[1] * REF_R * 0.8);
      }

      var an = d.top ? Math.PI / 2 : -Math.PI / 2;
      lab.arc("olab__normal", REF_P[0], REF_P[1], 30, an,
              Math.atan2(-d.dir[1], -d.dir[0]));
      if (!d.total) {
        lab.arc("olab__normal", REF_P[0], REF_P[1], 30, -an,
                Math.atan2(d.out[1], d.out[0]));
      }
      lab.dot("olab__focus", REF_P[0], REF_P[1], 2.5);
    },

    out: function (s, d, t, st) {
      var rows = [[st.out.a1, round1(s.ang) + "°"]];
      rows.push([st.out.a2, d.total ? t.w.total : round1(d.theta2) + "°",
                 d.total ? "warn" : ""]);
      if (d.crit !== null) rows.push([st.out.crit, round1(d.crit) + "°"]);
      return rows;
    },

    tasks: [
      { id: "a", kind: "find",
        ok: function (s, d) {
          return s.from === "top" && s.mat === "water" && s.ang >= 15
            && !d.total;
        } },
      { id: "b", kind: "find",
        ok: function (s, d) {
          return d.crit !== null && Math.abs(s.ang - d.crit) <= 1.2;
        } },
      { id: "c", kind: "find",
        ok: function (s, d) { return !d.total && d.bend > 20; } }
    ]
  };

  var LENS_X = 50;
  var LENS_A = 13;             // half aperture, cm
  var LENS_FT = 26;            // the focal length the first task asks for
  var LENS_TILT = 15;          // and the tilt the second one asks for

  var LENS = {
    id: "lens",
    span: 100,

    start: function () { return { f: 20, tilt: 0, kind: "conv" }; },

    clamp: function (s) {
      s.f = clamp(s.f, 8, 44);
      s.tilt = clamp(s.tilt, -20, 20);
    },

    solve: function (s) {
      var a = rad(s.tilt);
      var dir = [Math.cos(a), Math.sin(a)];
      var heights = [];
      for (var i = 0; i < 7; i += 1) heights.push(-10.5 + 3.5 * i);
      var conv = s.kind === "conv";
      // A thin lens images a bundle from infinity onto its focal plane, on the
      // line through the lens centre: that is the one construction both lens
      // types share, with the sign of f doing all the work.
      var fs = conv ? s.f : -s.f;
      var meet = [LENS_X + fs, fs * Math.tan(a)];
      var targetA = [LENS_X + LENS_FT, 0];
      var targetB = [LENS_X + LENS_FT,
                     LENS_FT * Math.tan(rad(LENS_TILT))];
      return {
        dir: dir, heights: heights, conv: conv, meet: meet,
        targetA: targetA, targetB: targetB,
        missA: Math.hypot(meet[0] - targetA[0], meet[1] - targetA[1]),
        missB: Math.hypot(meet[0] - targetB[0], meet[1] - targetB[1])
      };
    },

    ctls: function () {
      return [
        { key: "f", kind: "range", min: 8, max: 44, step: 0.5 },
        { key: "tilt", kind: "range", min: -20, max: 20, step: 0.5 },
        { key: "kind", kind: "toggle", opts: [["conv", "conv"], ["div", "div"]] }
      ];
    },

    handles: function (s, d) {
      return [{ x: d.meet[0], y: d.meet[1], free: "xy",
                set: function (st, x, y) {
                  var f = st.kind === "conv" ? x - LENS_X : LENS_X - x;
                  f = clamp(f, 8, 44);
                  st.f = f;
                  st.tilt = deg(Math.atan2(st.kind === "conv" ? y : -y, f));
                } }];
    },

    draw: function (lab, s, d, t) {
      lab.line("olab__axis", 0, 0, lab.span, 0);

      var shape = d.conv
        ? "M" + lab.P(LENS_X, LENS_A) + " Q" + lab.P(LENS_X + 5, 0) + " "
          + lab.P(LENS_X, -LENS_A) + " Q" + lab.P(LENS_X - 5, 0) + " "
          + lab.P(LENS_X, LENS_A) + " Z"
        : "M" + lab.P(LENS_X - 3.2, LENS_A) + " Q" + lab.P(LENS_X - 0.4, 0)
          + " " + lab.P(LENS_X - 3.2, -LENS_A) + " L"
          + lab.P(LENS_X + 3.2, -LENS_A) + " Q" + lab.P(LENS_X + 0.4, 0) + " "
          + lab.P(LENS_X + 3.2, LENS_A) + " Z";
      lab.path("olab__lens", shape);

      d.heights.forEach(function (h) {
        var enter = [LENS_X - d.dir[0] * 48, h - d.dir[1] * 48];
        lab.line("olab__ray", enter[0], enter[1], LENS_X, h);
        if (d.conv) {
          var after = lab.edge(LENS_X, h, d.meet[0] - LENS_X, d.meet[1] - h);
          lab.line("olab__ray", LENS_X, h, after[0], after[1]);
        } else {
          var away = [LENS_X - d.meet[0], h - d.meet[1]];
          var end = lab.edge(LENS_X, h, away[0], away[1]);
          lab.line("olab__ray", LENS_X, h, end[0], end[1]);
          lab.line("olab__ray--ghost", LENS_X, h, d.meet[0], d.meet[1]);
        }
      });

      [LENS_X + s.f, LENS_X - s.f].forEach(function (fx) {
        lab.dot("olab__focus", fx, 0, 3);
      });
      lab.txt("olab__label", LENS_X + s.f, 0, "F", "middle", 0, 16);
      lab.txt("olab__label", LENS_X - s.f, 0, "F", "middle", 0, 16);
      lab.txt("olab__label", LENS_X, LENS_A, t.w[d.conv ? "conv" : "div"],
              "middle", 0, -8);

      lab.dot("olab__target", d.targetA[0], d.targetA[1], 9);
      lab.dot("olab__targetdot", d.targetA[0], d.targetA[1], 2.4);
      lab.dot("olab__target", d.targetB[0], d.targetB[1], 9);
      lab.dot("olab__targetdot", d.targetB[0], d.targetB[1], 2.4);
    },

    out: function (s, d, t, st) {
      return [
        [st.out.f, round1(s.f) + " cm"],
        [st.out.meet, d.conv
          ? round1(d.meet[0] - LENS_X) + " cm, " + round1(d.meet[1]) + " cm"
          : t.w.virtual,
         d.conv && (d.missA <= 1.5 || d.missB <= 1.5) ? "good" : ""]
      ];
    },

    tasks: [
      { id: "a", kind: "find",
        ok: function (s, d) { return d.conv && d.missA <= 1.5; } },
      { id: "b", kind: "find",
        ok: function (s, d) { return d.conv && d.missB <= 1.5; } },
      { id: "c", kind: "look", ok: function (s) { return s.kind === "div"; } }
    ]
  };

  var RAIL_Y = -15;
  var BENCH_A = 13;        // half height of the lens and of the screen, cm

  var BENCH = {
    id: "bench",
    span: 100,

    start: function () {
      return { objX: 18, lensX: 50, scrX: 86, f: 14, objH: 7 };
    },

    clamp: function (s) {
      s.f = clamp(s.f, 6, 30);
      s.lensX = clamp(s.lensX, 26, 72);
      s.objX = clamp(s.objX, 10, s.lensX - 3);
      s.scrX = clamp(s.scrX, s.lensX + 3, 97);
      s.objH = clamp(s.objH, 3, 10);
    },

    solve: function (s) {
      var g = s.lensX - s.objX;
      var atFocus = Math.abs(g - s.f) < 0.08;
      var b = atFocus ? Infinity : g * s.f / (g - s.f);
      var real = !atFocus && b > 0;
      var imgX = s.lensX + b;
      var hi = atFocus ? Infinity : -s.objH * b / g;
      var defocus = real ? Math.abs(s.scrX - imgX) : Infinity;
      // The spot on the screen grows with the defocus in proportion to how
      // much of the lens the bundle uses: that is what "out of focus" is.
      var blur = real ? 6 * defocus / b : Infinity;
      return {
        g: g, b: b, real: real, atFocus: atFocus, imgX: imgX, hi: hi,
        mag: atFocus ? Infinity : Math.abs(b / g),
        defocus: defocus, blur: blur,
        sharp: real && defocus <= 1.2,
        inside: g < s.f - 0.08,
        thirdRay: s.objX < s.lensX - s.f - 0.4
      };
    },

    ctls: function () {
      return [
        { key: "objX", kind: "range", min: 10, max: 69, step: 0.5 },
        { key: "lensX", kind: "range", min: 26, max: 72, step: 0.5 },
        { key: "scrX", kind: "range", min: 29, max: 97, step: 0.5 },
        { key: "f", kind: "range", min: 6, max: 30, step: 0.5 },
        { key: "objH", kind: "range", min: 3, max: 10, step: 0.5 }
      ];
    },

    handles: function (s) {
      return [
        { x: s.objX, y: s.objH, free: "xy",
          set: function (st, x, y) { st.objX = x; st.objH = y; } },
        { x: s.lensX, y: RAIL_Y, free: "x",
          set: function (st, x) { st.lensX = x; } },
        { x: s.scrX, y: RAIL_Y, free: "x",
          set: function (st, x) { st.scrX = x; } },
        { x: s.lensX + s.f, y: 0, free: "x",
          set: function (st, x) { st.f = x - st.lensX; } }
      ];
    },

    draw: function (lab, s, d, t) {
      lab.line("olab__axis", 0, 0, lab.span, 0);
      lab.rectLab("olab__rail", 1, RAIL_Y, lab.span - 2, 3);
      for (var cm = 10; cm < 100; cm += 10) {
        lab.line("olab__post", cm, RAIL_Y, cm, RAIL_Y - 1.4);
        lab.txt("olab__label--small", cm, RAIL_Y - 2, String(cm), "middle", 0, 10);
      }

      // the lamp behind the object, and the object itself
      lab.lamp(s.objX - 8, 0);
      for (var j = -2; j <= 2; j += 1) {
        lab.line("olab__ray olab__ray--faint", s.objX - 7.2, 0,
                 s.objX - 0.6, j * 2.2);
      }
      lab.line("olab__post", s.objX, 0, s.objX, RAIL_Y);
      lab.arrowY("olab__arrow", s.objX, 0, s.objH);
      lab.txt("olab__label", s.objX, s.objH, t.w.object, "middle", 0, -10);

      // the lens on the rail, with both focal points marked
      lab.line("olab__post", s.lensX, -BENCH_A, s.lensX, RAIL_Y);
      lab.path("olab__lens",
               "M" + lab.P(s.lensX, BENCH_A) + " Q" + lab.P(s.lensX + 4.5, 0)
               + " " + lab.P(s.lensX, -BENCH_A) + " Q"
               + lab.P(s.lensX - 4.5, 0) + " " + lab.P(s.lensX, BENCH_A) + " Z");
      [s.lensX - s.f, s.lensX + s.f].forEach(function (fx) {
        lab.dot("olab__focus", fx, 0, 3);
        lab.txt("olab__label", fx, 0, "F", "middle", 0, 16);
      });

      // the screen
      lab.line("olab__post", s.scrX, -BENCH_A, s.scrX, RAIL_Y);
      lab.rectLab("olab__wall", s.scrX - 0.7, BENCH_A, 1.4, 2 * BENCH_A);
      lab.txt("olab__label", s.scrX, BENCH_A, t.w.screen, "middle", 0, -8);

      // what the screen actually catches
      if (d.real && isFinite(d.blur)) {
        var top = Math.max(d.hi, 0) + d.blur;
        var bot = Math.min(d.hi, 0) - d.blur;
        var spot = lab.rectLab("olab__spot", s.scrX - 0.7, top, 1.4, top - bot);
        spot.setAttribute("opacity", String(clamp(1 / (1 + d.blur * 0.7), 0.1, 0.95)));
      }

      var tip = [s.objX, s.objH];
      var stop = s.scrX;

      // ray one: parallel in, through the far focal point after the lens
      lab.line("olab__ray olab__ray--main", tip[0], tip[1], s.lensX, tip[1]);
      lab.rayToX("olab__ray olab__ray--main", s.lensX, tip[1],
                 s.f, -tip[1], stop);
      // ray two: straight through the centre of the lens
      lab.rayToX("olab__ray olab__ray--main", tip[0], tip[1],
                 s.lensX - tip[0], -tip[1], stop);
      // ray three: through the near focal point, parallel out
      if (d.thirdRay) {
        var m = -tip[1] / ((s.lensX - s.f) - tip[0]);
        var y3 = tip[1] + m * (s.lensX - tip[0]);
        if (Math.abs(y3) <= BENCH_A) {
          lab.line("olab__ray olab__ray--main", tip[0], tip[1], s.lensX, y3);
          lab.line("olab__ray olab__ray--main", s.lensX, y3, stop, y3);
        }
      }

      if (!d.atFocus) {
        if (d.real) {
          lab.arrowY("olab__image", d.imgX, 0, d.hi);
          lab.txt("olab__label", d.imgX, d.hi, t.w.image, "middle", 0,
                  d.hi < 0 ? 16 : -10);
        } else {
          // A virtual image: the rays never meet, their backward extensions do.
          lab.line("olab__ray--ghost", s.lensX, tip[1], d.imgX, d.hi);
          lab.line("olab__ray--ghost", s.lensX, 0, d.imgX, d.hi);
          lab.arrowY("olab__image olab__image--virtual", d.imgX, 0, d.hi);
          lab.txt("olab__label", d.imgX, d.hi, t.w.image + " (" + t.w.virtual + ")",
                  "middle", 0, -10);
        }
      }
    },

    out: function (s, d, t, st) {
      var kind = [];
      if (d.atFocus) {
        kind.push(t.w.none);
      } else {
        kind.push(d.real ? t.w.real : t.w.virtual);
        kind.push(d.hi < 0 ? t.w.inverted : t.w.upright);
        kind.push(d.mag > 1.04 ? t.w.bigger
          : (d.mag < 0.96 ? t.w.smaller : t.w.same));
      }
      var rows = [
        [st.out.g, round1(d.g) + " cm"],
        [st.out.b, d.real ? round1(d.b) + " cm"
          : (d.atFocus ? "∞" : round1(d.b) + " cm")],
        [st.out.m, kind.join(", ")],
        ["", d.real ? (d.sharp ? t.w.sharp : t.w.blurred) : t.w.none,
         d.sharp ? "good" : (d.real ? "" : "warn")],
        ["", "1/" + round1(s.f) + " = 1/" + round1(d.g)
          + (d.atFocus ? "" : " + 1/" + round1(d.b))]
      ];
      return rows;
    },

    tasks: [
      { id: "a", kind: "find", ok: function (s, d) { return d.sharp; } },
      { id: "b", kind: "find",
        ok: function (s, d) {
          return d.sharp && d.mag >= 0.92 && d.mag <= 1.08;
        } },
      { id: "c", kind: "find",
        ok: function (s, d) {
          return d.sharp && d.mag >= 1.85 && d.mag <= 2.15;
        } },
      { id: "d", kind: "find",
        ok: function (s, d) { return d.sharp && d.mag <= 0.6; } },
      // Inside the focal length alone is one shove of the slider, and at
      // g -> 0 the virtual image is not even magnified: the magnification is
      // f / (f - g), so asking for 2x is what puts the object *near* f, which
      // is where a magnifier is actually held.
      { id: "e", kind: "find",
        ok: function (s, d) { return d.inside && d.mag >= 2; } }
    ]
  };

  var STATIONS = [SHADOW, MIRROR, REFRACT, LENS, BENCH];

  // ------------------------------------------------------------------- lab

  function Lab(mount) {
    var self = this;
    this.mount = mount;
    this.lang = initialLang();
    this.solved = readStore();
    this.state = {};
    STATIONS.forEach(function (st) { self.state[st.id] = st.start(); });
    this.station = STATIONS[0];
    this.drag = null;
    this.W = 0;
    this.H = 0;
    this.sc = 1;
    this.halfY = 20;
    this.span = 100;
    this.build();
    this.show(STATIONS[0].id);
  }

  Lab.prototype.t = function () { return TEXT[this.lang]; };

  Lab.prototype.stText = function () {
    return TEXT[this.lang].st[this.station.id];
  };

  // ---------------------------------------------------------- the chrome

  Lab.prototype.build = function () {
    var self = this;
    this.mount.innerHTML = "";
    this.mount.classList.add("olab");

    var bar = el("div", "olab__bar", this.mount);
    var group = el("div", "olab__group", bar);
    this.stationLabel = el("span", "olab__glabel", group, "");
    this.stationButtons = {};
    STATIONS.forEach(function (st) {
      var button = el("button", "olab__opt", group, "");
      button.type = "button";
      button.addEventListener("click", function () { self.show(st.id); });
      self.stationButtons[st.id] = button;
    });

    el("span", "olab__spacer", bar);

    var langGroup = el("div", "olab__group", bar);
    this.langButtons = {};
    LANGS.forEach(function (code) {
      var button = el("button", "olab__opt", langGroup, code.toUpperCase());
      button.type = "button";
      button.addEventListener("click", function () {
        self.lang = code;
        try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* ignore */ }
        self.show(self.station.id);
      });
      self.langButtons[code] = button;
    });
    this.score = el("span", "olab__score", bar, "");

    this.head = el("p", "olab__head", this.mount, "");
    this.lead = el("p", "olab__lead", this.mount, "");

    this.wrap = el("div", "olab__stagewrap", this.mount);
    this.stage = svgEl("svg", { "class": "olab__stage", role: "img" }, this.wrap);
    this.bindPointer();

    this.outRow = el("div", "olab__out", this.mount);
    this.ctlRow = el("div", "olab__ctls", this.mount);
    this.say = el("p", "olab__say", this.mount, "");
    this.taskList = el("ol", "olab__tasks", this.mount);

    var foot = el("div", "olab__foot", this.mount);
    this.resetButton = el("button", "olab__opt", foot, "");
    this.resetButton.type = "button";
    this.resetButton.addEventListener("click", function () {
      if (!window.confirm(self.t().resetAsk)) return;
      self.solved = {};
      writeStore(self.solved);
      self.show(self.station.id);
    });

    this.help = el("p", "olab__help", this.mount, "");

    if (window.ResizeObserver) {
      new window.ResizeObserver(function () { self.relayout(); })
        .observe(this.wrap);
    } else {
      window.addEventListener("resize", function () { self.relayout(); });
    }
  };

  Lab.prototype.show = function (id) {
    var self = this;
    var t = this.t();
    STATIONS.forEach(function (st) {
      if (st.id === id) self.station = st;
      self.stationButtons[st.id].textContent = t.st[st.id].name;
      self.stationButtons[st.id].setAttribute("aria-pressed", st.id === id);
    });
    LANGS.forEach(function (code) {
      self.langButtons[code].setAttribute("aria-pressed", code === self.lang);
    });
    this.span = this.station.span;
    this.stationLabel.textContent = t.station;
    this.head.textContent = this.stText().head;
    this.lead.textContent = this.stText().lead;
    this.resetButton.textContent = t.reset;
    this.help.textContent = t.help;
    this.stage.setAttribute("aria-label", t.name + " — " + this.stText().name);
    this.say.textContent = "";
    this.say.className = "olab__say";
    this.buildTasks();
    this.buildControls();
    this.layout();
    this.refresh();
  };

  Lab.prototype.buildControls = function () {
    var self = this;
    var s = this.state[this.station.id];
    var t = this.t();
    var ctl = this.stText().ctl;
    this.ctlRow.innerHTML = "";
    this.inputs = {};
    this.station.ctls(s).forEach(function (spec) {
      var box = el("div", "olab__ctl", self.ctlRow);
      var label = el("label", "olab__clabel", box, ctl[spec.key]);
      if (spec.kind === "range") {
        var input = el("input", "olab__range", box);
        input.type = "range";
        input.min = String(spec.min);
        input.max = String(spec.max);
        input.step = String(spec.step);
        input.value = String(s[spec.key]);
        input.id = "olab-" + self.station.id + "-" + spec.key;
        label.setAttribute("for", input.id);
        input.addEventListener("input", function () {
          s[spec.key] = parseFloat(input.value);
          self.refresh();
        });
        self.inputs[spec.key] = input;
        return;
      }
      var row = el("div", "olab__toggles", box);
      if (spec.kind === "switch") {
        var button = el("button", "olab__opt", row, ctl[spec.key]);
        button.type = "button";
        button.setAttribute("aria-pressed", !!s[spec.key]);
        button.addEventListener("click", function () {
          s[spec.key] = !s[spec.key];
          self.buildControls();
          self.refresh();
        });
        label.textContent = "";
        return;
      }
      spec.opts.forEach(function (pair) {
        var opt = el("button", "olab__opt", row, t.w[pair[1]]);
        opt.type = "button";
        opt.setAttribute("aria-pressed", s[spec.key] === pair[0]);
        opt.addEventListener("click", function () {
          s[spec.key] = pair[0];
          self.buildControls();
          self.refresh();
        });
      });
    });
  };

  Lab.prototype.buildTasks = function () {
    var self = this;
    var t = this.t();
    var texts = this.stText().tasks;
    this.taskList.innerHTML = "";
    this.taskNodes = {};
    this.station.tasks.forEach(function (task) {
      var item = el("li", "olab__task", self.taskList);
      el("span", "olab__tick", item, "✓");
      var body = el("span", "", item);
      el("span", "olab__kind", body, t[task.kind]);
      body.appendChild(document.createTextNode(texts[task.id]));
      self.taskNodes[task.id] = item;
    });
  };

  // ------------------------------------------------------------- the view

  Lab.prototype.layout = function () {
    var width = this.wrap.clientWidth || 640;
    this.W = width;
    this.H = Math.round(clamp(width * 0.52, 240, 430));
    this.sc = this.W / this.span;
    this.halfY = (this.H / 2) / this.sc;
    this.stage.setAttribute("viewBox", "0 0 " + this.W + " " + this.H);
    this.stage.setAttribute("width", String(this.W));
    this.stage.setAttribute("height", String(this.H));
  };

  Lab.prototype.relayout = function () {
    var width = this.wrap.clientWidth || 640;
    if (!width || Math.abs(width - this.W) < 1) return;
    this.layout();
    this.refresh();
  };

  Lab.prototype.X = function (x) { return x * this.sc; };

  Lab.prototype.Y = function (y) { return this.H / 2 - y * this.sc; };

  Lab.prototype.P = function (x, y) {
    return round1(this.X(x)) + "," + round1(this.Y(y));
  };

  Lab.prototype.line = function (cls, x1, y1, x2, y2) {
    return svgEl("line", { "class": cls, x1: this.X(x1), y1: this.Y(y1),
                           x2: this.X(x2), y2: this.Y(y2) }, this.stage);
  };

  Lab.prototype.path = function (cls, d) {
    return svgEl("path", { "class": cls, d: d }, this.stage);
  };

  Lab.prototype.rectLab = function (cls, x, yTop, w, h) {
    return svgEl("rect", { "class": cls, x: this.X(x), y: this.Y(yTop),
                           width: Math.max(0.5, w * this.sc),
                           height: Math.max(0.5, h * this.sc) }, this.stage);
  };

  Lab.prototype.dot = function (cls, x, y, rPx) {
    return svgEl("circle", { "class": cls, cx: this.X(x), cy: this.Y(y),
                             r: rPx }, this.stage);
  };

  Lab.prototype.txt = function (cls, x, y, text, anchor, dx, dy) {
    var node = svgEl("text", { "class": "olab__label " + (cls || ""),
                               x: this.X(x) + (dx || 0),
                               y: this.Y(y) + (dy || 0),
                               "text-anchor": anchor || "middle" }, this.stage);
    node.textContent = text;
    return node;
  };

  /* Where a ray leaves the picture. The stage box is the only clipping the
     drawing needs, and doing it here keeps every station's draw() free of it. */
  Lab.prototype.edge = function (x0, y0, dx, dy) {
    var pad = 0.3;
    var t = Infinity;
    if (dx > 1e-9) t = Math.min(t, (this.span - pad - x0) / dx);
    if (dx < -1e-9) t = Math.min(t, (pad - x0) / dx);
    if (dy > 1e-9) t = Math.min(t, (this.halfY - pad - y0) / dy);
    if (dy < -1e-9) t = Math.min(t, (-this.halfY + pad - y0) / dy);
    if (!isFinite(t) || t < 0) t = 0;
    return [x0 + t * dx, y0 + t * dy];
  };

  /* Like edge(), but a screen standing in the way stops the ray first. */
  Lab.prototype.rayToX = function (cls, x0, y0, dx, dy, xStop) {
    var end = this.edge(x0, y0, dx, dy);
    if (dx > 1e-9 && x0 < xStop) {
      var toStop = (xStop - x0) / dx;
      var toEdge = (end[0] - x0) / dx;
      if (toStop < toEdge) end = [x0 + toStop * dx, y0 + toStop * dy];
    }
    return this.line(cls, x0, y0, end[0], end[1]);
  };

  Lab.prototype.arc = function (cls, cx, cy, rPx, a0, a1) {
    var r = rPx / this.sc;
    var span = a1 - a0;
    while (span > Math.PI) span -= 2 * Math.PI;
    while (span < -Math.PI) span += 2 * Math.PI;
    var pts = [];
    for (var i = 0; i <= 14; i += 1) {
      var a = a0 + span * i / 14;
      pts.push(this.P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
    return this.path(cls + " olab__arcline", "M" + pts.join(" L"));
  };

  Lab.prototype.lamp = function (x, y, ghost) {
    var suffix = ghost ? " olab__lampbody--ghost" : "";
    for (var i = 0; i < 8; i += 1) {
      var a = i * Math.PI / 4;
      var r0 = 9 / this.sc;
      var r1 = 14 / this.sc;
      this.line("olab__lampray" + suffix, x + r0 * Math.cos(a),
                y + r0 * Math.sin(a), x + r1 * Math.cos(a),
                y + r1 * Math.sin(a));
    }
    return this.dot("olab__lampbody" + suffix, x, y, 7);
  };

  /* An arrow drawn with strokes only, so one helper serves the dark object and
     the green image, whose classes have no fill. */
  Lab.prototype.arrowY = function (cls, x, y0, y1) {
    var head = 7 / this.sc;
    var sign = y1 >= y0 ? 1 : -1;
    var d = "M" + this.P(x, y0) + " L" + this.P(x, y1)
      + " M" + this.P(x - head * 0.6, y1 - sign * head)
      + " L" + this.P(x, y1)
      + " L" + this.P(x + head * 0.6, y1 - sign * head);
    return this.path(cls, d);
  };

  Lab.prototype.draw = function () {
    var self = this;
    var s = this.state[this.station.id];
    while (this.stage.firstChild) this.stage.removeChild(this.stage.firstChild);
    this.station.draw(this, s, this.d, this.t());
    this.station.handles(s, this.d).forEach(function (handle) {
      self.dot("olab__grab", handle.x, handle.y, 7);
    });
  };

  // ------------------------------------------------------- state and tasks

  Lab.prototype.refresh = function () {
    var s = this.state[this.station.id];
    this.station.clamp(s);
    this.d = this.station.solve(s);
    this.draw();
    this.showOut();
    this.syncInputs();
    this.checkTasks();
  };

  Lab.prototype.syncInputs = function () {
    var s = this.state[this.station.id];
    var key;
    for (key in this.inputs) {
      if (Object.prototype.hasOwnProperty.call(this.inputs, key)) {
        this.inputs[key].value = String(s[key]);
      }
    }
  };

  Lab.prototype.showOut = function () {
    var self = this;
    var rows = this.station.out(this.state[this.station.id], this.d, this.t(),
                                this.stText());
    this.outRow.innerHTML = "";
    rows.forEach(function (row) {
      var cls = "olab__chip" + (row[2] ? " olab__chip--" + row[2] : "");
      el("span", cls, self.outRow,
         row[0] ? row[0] + ": " + row[1] : row[1]);
    });
  };

  Lab.prototype.checkTasks = function () {
    var self = this;
    var s = this.state[this.station.id];
    var fresh = 0;
    this.station.tasks.forEach(function (task) {
      var key = self.station.id + "." + task.id;
      var ok = task.ok(s, self.d);
      if (ok && !self.solved[key]) {
        self.solved[key] = 1;
        writeStore(self.solved);
        fresh += 1;
      }
      var node = self.taskNodes[task.id];
      if (node) {
        node.className = "olab__task"
          + (self.solved[key] ? " olab__task--done" : "");
      }
    });
    if (fresh) {
      var all = this.station.tasks.every(function (task) {
        return self.solved[self.station.id + "." + task.id];
      });
      this.say.className = "olab__say olab__say--ok";
      this.say.textContent = all ? this.t().allDone : this.t().hit;
    }
    this.showScore();
  };

  Lab.prototype.showScore = function () {
    var self = this;
    var total = 0;
    var done = 0;
    STATIONS.forEach(function (st) {
      st.tasks.forEach(function (task) {
        total += 1;
        if (self.solved[st.id + "." + task.id]) done += 1;
      });
    });
    this.score.textContent = this.t().solved
      .replace("%a", String(done)).replace("%b", String(total));
  };

  // ------------------------------------------------------------- pointers

  /* Screen coordinates to centimetres. getScreenCTM carries the viewBox, the
     element's CSS size and any page scaling, so nothing here has to. */
  Lab.prototype.toLab = function (clientX, clientY) {
    var ctm = this.stage.getScreenCTM();
    if (!ctm) return null;
    var inv = ctm.inverse();
    var sx = inv.a * clientX + inv.c * clientY + inv.e;
    var sy = inv.b * clientX + inv.d * clientY + inv.f;
    return [sx / this.sc, (this.H / 2 - sy) / this.sc];
  };

  Lab.prototype.bindPointer = function () {
    var self = this;
    this.stage.addEventListener("pointerdown", function (ev) {
      var point = self.toLab(ev.clientX, ev.clientY);
      if (!point) return;
      var state = self.state[self.station.id];
      var handles = self.station.handles(state, self.d);
      var best = null;
      var bestPx = GRAB_PX;
      handles.forEach(function (handle) {
        var away = Math.hypot((handle.x - point[0]) * self.sc,
                              (handle.y - point[1]) * self.sc);
        if (away < bestPx) { bestPx = away; best = handle; }
      });
      if (!best) return;
      self.drag = best;
      try { self.stage.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      ev.preventDefault();
    });
    this.stage.addEventListener("pointermove", function (ev) {
      if (!self.drag) return;
      var point = self.toLab(ev.clientX, ev.clientY);
      if (!point) return;
      self.drag.set(self.state[self.station.id], point[0], point[1]);
      self.refresh();
      ev.preventDefault();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
      self.stage.addEventListener(name, function () { self.drag = null; });
    });
  };

  // ------------------------------------------------------------------ boot

  function mountAll() {
    var mounts = document.querySelectorAll(".olab");
    if (!mounts.length) return;
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    Array.prototype.forEach.call(mounts, function (mount) {
      var lab = new Lab(mount);
      if (window.__OLAB_TEST__) window.__OLAB_TEST__.labs.push(lab);
    });
  }

  // Test hook, inert on the live page. tools/optics_proof.html sets
  // window.__OLAB_TEST__ before this file loads and then drives every station
  // through its tasks, which is the only way to check that each task can
  // actually be solved with the controls the station offers.
  if (window.__OLAB_TEST__) {
    window.__OLAB_TEST__ = { Lab: Lab, stations: STATIONS, text: TEXT,
                             langs: LANGS, labs: [], css: CSS };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }
}());
