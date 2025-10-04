// import mqtt from "mqtt";
// import googleTTS from "google-tts-api";
// import { Client, DefaultMediaReceiver } from "castv2-client";

// const GOOGLE_HOME_IP = "192.168.100.6"; // IP Google Home di LAN
// const MQTT_URL = "mqtt://103.27.206.14:1883"; // contoh broker publik

// // Connect ke MQTT broker
// const clientMqtt = mqtt.connect(MQTT_URL);

// // Subscribe topic
// clientMqtt.on("connect", () => {
//   console.log("Connected to MQTT broker");
//   clientMqtt.subscribe("home/tts");
// });

// // Saat ada pesan baru
// clientMqtt.on("message", (topic, message) => {
//   const text = message.toString();
//   console.log("Pesan masuk:", text);
//   castTTS(text);
// });

// function castTTS(text) {
//   const url = googleTTS.getAudioUrl(text, {
//     lang: "id",
//     slow: false,
//     host: "https://translate.google.com",
//   });

//   const client = new Client();
//   client.connect(GOOGLE_HOME_IP, () => {
//     client.launch(DefaultMediaReceiver, (err, player) => {
//       if (err) throw err;

//       const media = {
//         contentId: url,
//         contentType: "audio/mp3",
//         streamType: "BUFFERED",
//       };

//       player.load(media, { autoplay: true }, (err, status) => {
//         if (err) throw err;
//         console.log("Google Home speaking:", text);
//       });
//     });
//   });
// }
import mqtt from "mqtt";
import googleTTS from "google-tts-api";
import { Client, DefaultMediaReceiver } from "castv2-client";

const GOOGLE_HOME_IP = "192.168.100.6"; // IP Google Home di LAN
const MQTT_URL = "mqtt://103.27.206.14:1883"; // contoh broker publik

// Connect ke MQTT broker
const clientMqtt = mqtt.connect(MQTT_URL);

// Subscribe topic
clientMqtt.on("connect", () => {
  console.log("Connected to MQTT broker");
  clientMqtt.subscribe("home/tts");
});

// Saat ada pesan baru
clientMqtt.on("message", (topic, message) => {
  const text = message.toString();
  console.log("Pesan masuk:", text);
  castTTS(text);
});

async function castTTS(text) {
  try {
    // Ambil semua URL audio (split otomatis kalau teks >200 char)
    const urls = googleTTS.getAllAudioUrls(text, {
      lang: "id",
      slow: false,
      host: "https://translate.google.com",
    });

    console.log(`Teks panjang, dipecah menjadi ${urls.length} bagian`);

    // Connect ke Google Home
    const client = new Client();
    client.connect(GOOGLE_HOME_IP, () => {
      client.launch(DefaultMediaReceiver, (err, player) => {
        if (err) throw err;

        // Rekursif untuk play per bagian
        const playPart = (index) => {
          if (index >= urls.length) {
            console.log("Selesai memutar semua bagian TTS");
            client.close();
            return;
          }

          const part = urls[index];
          const media = {
            contentId: part.url,
            contentType: "audio/mp3",
            streamType: "BUFFERED",
          };

          console.log(
            `Google Home speaking part ${index + 1}:`,
            part.shortText
          );

          player.load(media, { autoplay: true }, (err) => {
            if (err) throw err;

            // Setelah selesai play, lanjut ke bagian berikutnya
            player.on("status", (status) => {
              if (status.playerState === "IDLE") {
                playPart(index + 1);
              }
            });
          });
        };

        // Mulai play dari bagian pertama
        playPart(0);
      });
    });
  } catch (err) {
    console.error("TTS Error:", err);
  }
}
