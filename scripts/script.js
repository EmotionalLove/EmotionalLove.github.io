// background images
const clearMoonBackground = "img/bg-moon-clear.jpg";
const clearBackground = "img/bg-clear.jpg";
const cloudyBackground = "img/bg-cloudy.png";
const partlyCloudyBackground = "img/bg-partly-cloudy.jpg";
const partlyCloudyMoonBackground = "img/bg-partly-cloudy-moon.png";
const rainingBackground = "img/bg-raining.jpg";
const thunderstormBackground = "img/bg-thunderstorm.jpg";
const snowingBackground = "img/bg-snowing.jpg";
// icons
const cloudy = "img/cloudy.png";
const cloudyMoon = "img/cloudy_moon.png";
const moon = "img/moon.png";
const partlyCloudy = "img/partly_cloudy.png";
const rain = "img/rain.png";
const snowing = "img/snowing.png";
const sunny = "img/sunny.png";
const thunderstorm = "img/thunderstorm.png";
// api stuffs
const apiKey = "a38840a0393d883471999cf80d4d715c";

let forecast = [];
let city = "Salt Lake City";

$("document").ready(() => {
    $(":root").css({
        "background": "url(\"\") no-repeat center center fixed",
        "background-size": "cover"
    });
    getWeather();
    getForecast();
    $(".city-container").draggable();
});


/**
 * Get the 5-day forecast and display it to the webpage.
 */
function getForecast() {
    fetch(appendApiKey(`https://api.openweathermap.org/data/2.5/forecast?q=${city}`))
        .then(res => {
            res.json()
                .then(json => {
                    forecast = [];
                    let dt;
                    let curr;
                    for (let w of json.list) {
                        let date = new Date(w.dt * 1000);
                        if (dt === undefined) {
                            curr = new WeatherDay(date);
                            dt = date;
                        }
                        if (dt.getDate() !== date.getDate()) {
                            console.log(curr.toString());
                            forecast.push(curr);
                            curr = new WeatherDay(date);
                            dt = date;
                        }
                        curr.register(new Forecast(w));
                    }
                    const id = "#day";
                    for (let i = 0; i < forecast.length; i++) {
                        let dateString = forecast[i].date.getMonth() + 1 + " / " + forecast[i].date.getDate();
                        let today = new Date();
                        if (forecast[i].date.getDate() === today.getDate()) dateString = "Today";
                        if (forecast[i].date.getDate() === today.getDate() + 1) dateString = "Tomorrow";
                        $(id + (i + 1)).html(dateString + "<br><img class='forecast-icon' alt='icon' src='" + forecast[i].getMostSevere() + "' <br>" + forecast[i].getHigh() + "&degF / " + forecast[i].getLow() + "&degF");
                    }
                })
        });
}

/**
 * Get the current weather and display it to the webpage.
 */
function getWeather() {
    fetch(appendApiKey(`https://api.openweathermap.org/data/2.5/weather?q=${city}`))
        .then(res => {
            if (res.status !== 200) {
                $("#city_field").addClass("error-field");
                return;
            }
            $("#city_field").removeClass("error-field");
            res.json()
                .then(json => {
                    console.log(json.name);
                    let forecast = new Forecast(json);
                    console.log(forecast.toString());
                    $("#city").html("<input id='city_field' class='field' type='text' value='" + city + "'>" + "<img id=\"current-icon\" alt=\"icon\" src=\"" + forecast.getIcon() + "\"/> " + forecast.temperature + "&deg F");
                    $("#city_field").fadeOut(200);
                    $("#city_field").fadeIn(200); // hint to the user that they can change the city.
                    $("#city_field").keypress((e) => {
                        if (e.keyCode === 13) {
                            city = $("#city_field").val();
                            getForecast();
                            getWeather();
                        }
                    });
                    setBackground(forecast.getBackground());
                })
        });
}

function appendApiKey(s) {
    return s + "&appid=" + apiKey;
}

function KtoF(kelvin) {
    return Math.round((kelvin - 273.15) * 9 / 5 + 32);
}

function setBackground(file) {
    $(":root").css({
        "background": "url(\"" + file + "\") no-repeat center center fixed",
        "background-size": "cover"
    });
}

class WeatherDay {
    constructor(dt) {
        this.date = dt;
        this.temps = [];
        this.icons = [];
    }

    /**
     * Add a temperature and a condition for this day.
     * @param forecast
     */
    register(forecast) {
        this.temps.push(forecast.getTemperature());
        this.icons.push(forecast.getIcon(true));
    }

    /**
     * Get the highest temperature for this day
     * @returns {number}
     */
    getHigh() {
        let highest = -9999;
        for (let t of this.temps) {
            if (highest < t) highest = t;
        }
        return highest;
    }

    /**
     * Get the lowest temperature for this day
     * @returns {number}
     */
    getLow() {
        let lowest = 9999;
        for (let t of this.temps) {
            if (lowest > t) lowest = t;
        }
        return lowest;
    }

    /**
     * Get the most severe weather condition for this day.
     */
    getMostSevere() {
        let mostSevere = undefined;
        for (let icon of this.icons) {
            if (mostSevere === undefined) {
                mostSevere = icon;
                continue;
            }
            if (isMoreSevere(mostSevere, icon)) mostSevere = icon;
        }
        return mostSevere;
    }

    toString() {
        return this.date + " " + this.getHigh() + "/" + this.getLow() + " " + this.getMostSevere();
    }
}

/**
 * Determine whether {@param current} is more severe than {@param old}
 * @returns {boolean}
 */
function isMoreSevere(old, current) {
    if (old === sunny || old === moon) {
        return true;
    } else if ((old === partlyCloudy || old === cloudyMoon) && (current !== sunny && current !== moon)) {
        return true;
    } else if ((old === cloudy) && (current !== sunny && current !== moon) && (current !== partlyCloudy && current !== cloudyMoon)) {
        return true;
    } else if ((old === rain) && (current !== sunny && current !== moon) && (current !== partlyCloudy && current !== cloudyMoon) && (current !== cloudy)) {
        return true;
    } else if ((old === thunderstorm) && (current !== sunny && current !== moon) && (current !== partlyCloudy && current !== cloudyMoon) && (current !== cloudy) && (current !== rain)) {
        return true;
    } else if ((old === snowing) && (current !== sunny && current !== moon) && (current !== partlyCloudy && current !== cloudyMoon) && (current !== cloudy) && (current !== rain) && current !== thunderstorm) {
        return true;
    }
    return false;
}

class Forecast {
    constructor(json, code) {
        this.weatherTypeCode = code === undefined ? json.weather[0].id : code;
        this.date = new Date(json.dt * 1000);
        this.temperature = KtoF(json.main.temp);
    }

    getTemperature() {
        return this.temperature;
    }

    getDate() {
        return this.date;
    }

    getWeatherTypeCode() {
        return this.weatherTypeCode;
    }

    getIcon(noNight) {
        if (this.weatherTypeCode === 800) {
            return this.isDay() || noNight ? sunny : moon;
        } else if (this.weatherTypeCode >= 803) {
            return cloudy;
        } else if (this.weatherTypeCode >= 801) {
            return this.isDay() || noNight ? partlyCloudy : cloudyMoon;
        } else if (this.weatherTypeCode >= 701) {
            // dust
            return this.isDay() || noNight ? partlyCloudy : cloudyMoon;
        } else if (this.weatherTypeCode >= 600) {
            return snowing;
        } else if (this.weatherTypeCode >= 500) {
            return rain;
        } else if (this.weatherTypeCode >= 300) {
            return rain;
        } else {
            return thunderstorm;
        }
    }

    getBackground() {
        if (this.weatherTypeCode === 800) {
            return this.isDay() ? clearBackground : clearMoonBackground; // todo sunny
        } else if (this.weatherTypeCode >= 803) {
            return cloudyBackground;
        } else if (this.weatherTypeCode >= 801) {
            return this.isDay() ? partlyCloudyBackground : partlyCloudyMoonBackground;
        } else if (this.weatherTypeCode >= 701) {
            // dust
            return cloudyBackground;
        } else if (this.weatherTypeCode >= 600) {
            return snowingBackground;
        } else if (this.weatherTypeCode >= 500) {
            return rainingBackground;
        } else if (this.weatherTypeCode >= 300) {
            return rainingBackground;
        } else {
            return thunderstormBackground;
        }
    }

    isDay() {
        return this.date.getHours() < 19 && this.date.getHours() > 7;
    }

    toString() {
        return this.getDate().toDateString() + " " + this.getTemperature() + " " + this.getIcon();
    }
}