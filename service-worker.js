const CACHE_NAME = "prayer-times-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",

  "./sounds/adhan.mp3",

  // Core icons
  "./icons/android/android-launchericon-192-192.png",
  "./icons/android/android-launchericon-512-512.png",
  "./icons/ios/180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("Caching app shell...");

      await cache.addAll(FILES_TO_CACHE);

      // Cache all icons listed in icons.json
      const iconsResponse = await fetch("./icons/icons.json");
      const iconsData = await iconsResponse.json();

      const iconFiles = iconsData.icons.map(
        (icon) => "./icons/" + icon.src
      );

      await cache.addAll(iconFiles);

      console.log("All icons cached ✅");
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((resp) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        })
      );
    })
  );
});
