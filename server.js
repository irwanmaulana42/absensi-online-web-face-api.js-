const express = require('express')
const path = require('path')
const {get, post } = require('request')
const services = require('./services');
var fs = require('fs');
var bodyParser = require("body-parser");
var multer = require('multer');

var dir = './images/';

const app = express()

app.use(bodyParser.json());

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, './images')))
app.use(express.static(path.join(__dirname, './media')))
app.use(express.static(path.join(__dirname, './weights')))
app.use(express.static(path.join(__dirname, './dist')))

app.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'index.html')))
app.get('/absensi', (req, res) => res.sendFile(path.join(viewsDir, 'absensi.html')))
app.get('/user', (req, res) => res.sendFile(path.join(viewsDir, 'user.html')))
app.get('/report', (req, res) => res.sendFile(path.join(viewsDir, 'report.html')))

// Multer
var storage = multer.diskStorage({
    destination: (req, file, callback) => {
        console.log("REQ DEST", req.body);
        const { card_id, nama } = req.body;
        callback(null, './images/' + card_id + '__' + nama + '/');
    },
    filename: (req, file, callback) => {
        const { card_id, nama } = req.body;
        console.log("REQ FILENAME", req.body);
        callback(null, nama + '-' + Date.now() + path.extname(file.originalname))
    }
});

var upload = multer({ storage: storage });

app.post('/fetch_external_image', async(req, res) => {
    const { imageUrl } = req.body
    if (!imageUrl) {
        return res.status(400).send('imageUrl param required')
    }
    try {
        const externalResponse = await request(imageUrl)
        res.set('content-type', externalResponse.headers['content-type'])
        return res.status(202).send(Buffer.from(externalResponse.body))
    } catch (err) {
        return res.status(404).send(err.toString())
    }
})

app.post('/getAllNames', async(req, res) => {
    let data = await services.getAllNames().catch(err => err);
    res.status(200).json(data);
});

app.post('/getAllReports', async(req, res) => {
    let data = await services.getDataReports().catch(err => err);
    res.status(200).json(data);
})

app.post('/addImage', upload.array('multipleImages'), async(req, res) => {
    var message = encodeURIComponent('gambar berhasil di insert.');
    res.redirect('/user?message=' + message);
})

app.post('/postUser', async(req, res) => {
    const { nama, id_card } = req.body;
    const cekIdCard = await services.checkIdCard(id_card);
    if (cekIdCard < 1) {
        if (!fs.existsSync(dir + id_card + '__' + nama)) {
            fs.mkdirSync(dir + id_card + '__' + nama);
        }
        await services.insertUserToDB(id_card, nama).catch(err => err);
        var message = encodeURIComponent('Data berhasil dibuat.');
        res.redirect('/user?message=' + message);
    } else {
        var message = encodeURIComponent('Card ID sudah terdaftar.');
        res.redirect('/user?message=' + message);
    }
});

app.get('/getTableUser', async(req, res) => {
    let data = await services.getDatausers().catch(err => err);
    res.json(data);
})

app.post('/absensi', async(req, res) => {
    const { card_id, nama, type } = req.body;
    console.log({ card_id, nama, type })
    let data = await services.checkAbsensi(card_id, nama, type).catch(err => err);
    let message = encodeURIComponent(data.message);
    return res.redirect('/?message=' + message);
})

function request(url, returnBuffer = true, timeout = 10000) {
    return new Promise(function(resolve, reject) {
        const options = Object.assign({}, {
                url,
                isBuffer: true,
                timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
                }
            },
            returnBuffer ? { encoding: null } : {}
        )

        get(options, function(err, res) {
            if (err) return reject(err)
            return resolve(res)
        })
    })
}


app.listen(3000, () => console.log('Listening on port 3000!'))