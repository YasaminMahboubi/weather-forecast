const axios = require('axios');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.set('view engine' , 'ejs');
app.use('/public',express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

app.get('/',  (req, res) => { 
    fetchCity().then(data => {
        buildHTML(data).then(htmlInfo => {
          res.render('index', { htmlData: htmlInfo });
        })
    });
}) 

async function buildHTML(data){
    try {
            const weatherRes = await fetchWeather(data);
            if(weatherRes == 404){
                return 404;
            }
            let todayArray = [];
            for(let i=0;i<6;i++){
                let clock = Number(weatherRes.list[i]['dt_txt'].split(' ')[1].split(':')[0]) < 12 ?                     
                                Number(weatherRes.list[i]['dt_txt'].split(' ')[1].split(':')[0])  + ":00 AM" : 
                                Number(weatherRes.list[i]['dt_txt'].split(' ')[1].split(':')[0]) + "00: PM";
                todayArray[i] = [ clock , 
                                `public/images/${weatherRes.list[i].weather[0].icon}.png`,
                                Math.floor(weatherRes.list[i].main.temp - 273.15)
                                ];
            }

            let d = new Date;
            let today = d.getDay();
            let sevenDayArray = [];
            for(i=0;i<5;i++){
                let day = '';
                let dayCounter = 0;
                if(today+i > 6){
                    dayCounter = today+i - 7;
                    day = days[dayCounter]
                }else{
                    day = days[today+i]
                }
                if(i == 0){
                    day = "today";
                }
                sevenDayArray[i] = [ day , 
                                    `public/images/${weatherRes.list[i].weather[0].icon}.png`,
                                    Math.floor(weatherRes.list[i].main.temp_min - 273) + '/' + Math.ceil(weatherRes.list[i].main.temp_max - 273.15)
                                ];
            }
            let htmlInfo = {
                city: data,
                mainDesc: weatherRes.list[0].weather[0].main,
                temp: Math.floor(weatherRes.list[0].main.temp - 273.15),
                icon: `public/images/${weatherRes.list[0].weather[0].icon}.png`,
                humidity: weatherRes.list[0].main.humidity,
                desc: weatherRes.list[0].weather[0].description,

                forecastToday: todayArray,
                sevenDay: sevenDayArray
            };

        return htmlInfo;

        } catch (error) {
          console.error('Error in buildHTML:', error);
          throw error; 
        }
}

async function getIp() {
    const response = await axios.get('https://api.ipify.org?format=json');
    const publicIp = await response.data.ip;
    return publicIp;
}

async function fetchCity() {
    try {
        let publicIp = await getIp();
        const response = await fetch(`https://www.iplocate.io/api/lookup/${publicIp}/json?apikey=17e28da65f14ef679cb51a76a6edeefd`);
        const result = await response.json();
        return result.city; 
    } 
    catch (err) {
        console.error(err);
    }
}
async function fetchWeather(city) {
    try{
        const response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=ce2100858e026bf52e7c89aa4154e525`)
        if(response.status == 200){
            const result = await response.json();
            return result;
        }else{
            return 404;
        }
    }
    catch(err){
        console.error(err);
    }
}

app.post('/city' , (req,res) => {
    buildHTML(req.body.searchCity).then(htmlInfo => {
        if(htmlInfo == 404){
            fetchCity().then(data => {
                buildHTML(data).then(htmlInfo => {
                  htmlInfo.error = true;
                  res.render('index', { htmlData: htmlInfo });
                })
            });
        }else{
            htmlInfo.error = false;
            res.render('index', { htmlData: htmlInfo });
        }
      })
})

app.listen(3000 , () => {
    console.log('app is listening to port 3000');
})