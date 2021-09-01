const api_url = "https://api.wheretheiss.at/v1/satellites/25544";
const lat = document.getElementById("lat");
const long = document.getElementById("long");
const hoogte = document.getElementById("hoogte");
const snelheid = document.getElementById("snelheid");
const select_box = document.getElementById("tile-type");

//gewenste lengte van het path
const length = 97;
const path_options = {
  weight: 6,
  opacity: 0.69,
  dashArray: "2 11",
  color: "#1937a2"
};

// eslint-disable-next-line no-undef
const iss_map = L.map("map_id").setView([0, 0], 2);
const icon = L.icon({
  iconUrl: "iss_logo.png",
  iconSize: [40, 26],
  iconAnchor: [20, 13]
});
const marker = L.marker([0, 0], { icon }).addTo(iss_map);
// const attr =
//   '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
// const tile_url = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png";

// L.tileLayer(tile_url, {
//   attribution: attr
// }).addTo(iss_map);

const tile_styles = ["terrain", "toner", "watercolor"];
select_layer(0);

function select_layer(layer_id) {
  let layer = new L.StamenTileLayer(tile_styles[layer_id]);
  iss_map.addLayer(layer);
}

function fill_selectbox() {
  for (let i = 0; i < tile_styles.length; ++i) {
    select_box.insertAdjacentHTML(
      "beforeend",
      '<option value="' + i + '">' + tile_styles[i] + "</option>"
    );
  }
}

function print_number(number, digits) {
  return Number.parseFloat(number).toFixed(digits);
}

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function get_ISS_at_time(timestamp) {
  const api_url =
    "https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=" +
    timestamp;

  const res = await fetch(api_url);
  const data = await res.json();
  const lat = data[0].latitude;
  const lng = data[0].longitude;

  return { lat, lng };
}

async function get_ISS() {
  const result = await fetch(api_url);
  const data = await result.json();
  const position = [data.latitude, data.longitude];

  lat.textContent = print_number(data.latitude, 4);
  long.textContent = print_number(data.longitude, 4);
  hoogte.textContent = print_number(data.altitude, 0) + " km";
  snelheid.textContent = print_number(data.velocity, 0) + " km/u";

  marker.setLatLng(position);
  iss_map.setView(position, 3);

  return data.timestamp;

  // L.tileLayer(
  //   "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
  //   {
  //     maxZoom: 16,
  //     id: "mapbox/satellite-v9",
  //     tileSize: 512,
  //     zoomOffset: -1,
  //     accessToken:
  //       "pk.eyJ1IjoibWF0aGlmbGlwIiwiYSI6ImNrcjNiYmZxdTB5OTcyeXFtOGs2MHMyaDIifQ.ep5suAAZ52AJUncx9nS7Hw",
  //   }
  // ).addTo(iss_map);

  // L.marker(position).addTo(iss_map);
}

function get_key_of_el(el) {
  if (el[1] < -170 && el[1] > -180) {
    return el[1];
  }
}

fill_selectbox();

select_box.addEventListener("change", event => {
  select_layer(event.target.value);
});

get_ISS()
  .then(timestamp => {
    let start = timestamp - (length / 2) * 60;

    return Promise.all(
      Array.from({ length: length }, (_, i) => {
        return get_ISS_at_time(start + 60 * i).then(pos => [pos.lat, pos.lng]);
      })
    );
  })
  .then(positions => {
    // splits de positions array in 2 op de datumlijn
    // console.table(positions);
    const index = positions.findIndex(get_key_of_el);

    const positions_array = [positions.slice(index), positions.slice(0, index)];

    let poly = L.polyline(positions_array, path_options).addTo(iss_map);
    // iss_map.fitBounds(poly.getBounds());
  });

setInterval(get_ISS, 1690);
