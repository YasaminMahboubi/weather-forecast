const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

app.set('view engine' , 'ejs');
app.use('/public' , express.static(path.join(__dirname , "public")));
app.use(bodyParser.urlencoded({ extended: false }));

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

let dayName = [];
const dayOfTheWeek = () => {
    let date = new Date;
    let today = date.getDay();

    for(let i = 0; i<5 ; i++){
        if(today+i > 6){
            dayName.push(days[today+i - 7]);
        }
        else if(i == 0){
            dayName.push("today");
        }
        else{
            dayName.push(days[today+i]);
        }
        console.log(dayName);
    }
}

app.get('/',  async (req, res) => { 
    try{
        let cityName = await fetchCity();
        let htmlInfo = await buildHTML(cityName);
        res.render('index', { htmlData: htmlInfo });
    }
    catch(error){
        console.error("get contents error : " + error);
        res.sendStatus(404);
    }
}) 

async function buildHTML(data){
    try {
            const weatherRes = await fetchWeather(data);
            if(!weatherRes){
                return false;
            }
            let todayArray = [];
            for(let i=0;i<6;i++){
                let time = Number(weatherRes.list[i]['dt_txt'].split(' ')[1].split(':')[0]);
                let clock   =   time < 12 ? time + " :00 AM" : time + " :00 PM";
                todayArray[i] = [ clock , 
                                `public/images/${weatherRes.list[i].weather[0].icon}.png`,
                                Math.floor(weatherRes.list[i].main.temp - 273.15)
                                ];
            }
           
                dayOfTheWeek();
                let fiveDayArray = [];
                let timeNow = weatherRes.list[0]['dt_txt'].split(' ')[1].split(':')[0];
                let hourCounter = ( 24 - timeNow ) / 3;

                fiveDayArray[0] = [ dayName[0] , 
                `public/images/${weatherRes.list[0].weather[0].icon}.png`,
                Math.floor(weatherRes.list[0].main.temp_min - 273) + '/' + Math.ceil(weatherRes.list[0].main.temp_max - 273.15)];

                let arrayCounter = 1;
                for(let i = hourCounter; i<weatherRes.list.length-9; i += 9){
                    fiveDayArray[arrayCounter] = [ dayName[arrayCounter] , 
                        `public/images/${weatherRes.list[i].weather[0].icon}.png`,
                        Math.floor(weatherRes.list[i].main.temp_min - 273) + '/' + Math.ceil(weatherRes.list[i].main.temp_max - 273.15)
                    ];
                    arrayCounter++;
                }
            let htmlInfo = {
                city: data,
                mainDesc: weatherRes.list[0].weather[0].main,
                temp: Math.floor(weatherRes.list[0].main.temp - 273.15),
                icon: `public/images/${weatherRes.list[0].weather[0].icon}.png`,
                humidity: weatherRes.list[0].main.humidity,
                desc: weatherRes.list[0].weather[0].description,
                forecastToday: todayArray,
                fiveDayForecast: fiveDayArray
            };

        return htmlInfo;

        } catch (error) {
          console.error('Error in buildHTML:', error);
          return false;
        }
}

async function getIp() {
    try{
        const response = await fetch('https://api.ipify.org?format=json');
        const responseJson = await response.json();
        return  responseJson.ip;
    }
    catch(err){
        console.error("error in getIp is" + err);
        return false;
    }
}

async function fetchCity() {
    try {
        let publicIp   = await getIp();
        const response = await fetch(`https://www.iplocate.io/api/lookup/${publicIp}/json?apikey=17e28da65f14ef679cb51a76a6edeefd`);                
        const result   = await response.json();
        return result.city;
    }
    catch (err) {
        console.error("error in fetchCity is" + err);
        return false;
    }
}

async function fetchWeather(city) {
    try{
        const response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=ce2100858e026bf52e7c89aa4154e525`);
        const result = await response.json();
        return result;
    }
    catch(err){
        console.error("error in fetchWeather is" + err);
        return false;
    }
}

app.post('/city' , async (req,res) => {
    try{
        let htmlInfo = await buildHTML(req.body.searchCity);
        if(!htmlInfo){
            let data = await fetchCity();
            let htmlInfo = await buildHTML(data);
            htmlInfo.error = true;
            res.render('index', { htmlData: htmlInfo });
        }else{
            htmlInfo.error = false;
            res.render('index', { htmlData: htmlInfo });
        }
    }
    catch(err){
        console.error("error in /city is "+ err);
        res.sendStatus(404);
    }   
})

app.listen(3000 , () => {
    console.log('app is listening to port 3000');
})
