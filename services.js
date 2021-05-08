const fs = require('fs');
const folderImages = './images';

var connection = require('./conn');

const checkAbsensi = (card_id, nama, type) => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT *, TIME(timestamp) as jam FROM absensi WHERE card_id = ? AND nama = ? AND type = ? AND date(timestamp) = CURDATE() LIMIT 1", [card_id, nama, type], (err, rows, fields) => {
            if (err) {
                console.log(err);
                reject(err);
            }

            if (typeof rows[0] !== 'undefined') {
                resolve({
                    status: 201,
                    message: `Nama <strong>${nama}</strong> dengan ID Card <strong>${card_id}</strong> <strong>SUDAH</strong> melakukan absensi <strong>${type}</strong> pada hari ini pada jam <strong>${rows[0].jam}</strong>`
                });
            } else {
                connection.query("INSERT INTO `absensi` (`card_id`, `nama`, `timestamp`, `type`, `created_at`) VALUES (?, ?, NOW(), ?, NOW())", [
                    card_id,
                    nama,
                    type
                ], (errInsert, rowsInsert, fieldsInsert) => {
                    if (errInsert) {
                        console.log(errInsert);
                        reject(errInsert);
                    }
                    var time = new Date();

                    var hh = time.getHours();
                    var mm = time.getMinutes();
                    var ss = time.getSeconds()
                    resolve({
                        status: 200,
                        message: `Nama <strong>${nama}</strong> dengan ID Card <strong>${card_id}</strong> <strong>BERHASIL</strong> melakukan absensi <strong>${type}</strong> pada hari ini pada jam <strong>${hh + ":" + mm + ":" + ss}</strong>`
                    });
                })
            }
        })
    })
}

const insertUserToDB = (id_card, nama) => {
    return new Promise((resolve, reject) => {
        connection.query("INSERT INTO `users` (`id_card`, `nama`, `created_at`) VALUES (?, ?, NOW())", [id_card, nama], (err, rows, fields) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(true);
        })
    })
}

const getDatausers = () => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT *,concat(id_card, '__', nama) as folder_name  FROM users", (err, rows, fields) => {
            if (err) {
                console.log(err);
                reject(err)
            }
            if (rows.length > 0) {
                let temp = rows.map((item) => {
                    return {
                        ...item,
                        classes: item.folder_name,
                        images: fs.readdirSync(folderImages + '/' + item.folder_name, { withFileTypes: true }).map((file) => {
                            return file.name;
                        })
                    }
                });

                resolve(temp);
            } else {
                resolve(0);
            }
        })
    })
}

const checkIdCard = (id_card) => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT count(*) as count FROM users WHERE id_card = ?", [id_card], (err, rows, fields) => {
            if (err) {
                console.log(err);
                reject(err);
            }

            resolve(rows[0].count);
        })
    });
}

const getAllNames = () => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT concat(id_card, '__', nama) as folder_name FROM users", (err, rows, fields) => {
            if (err) {
                console.log(err);
                reject(err);
            }

            if (rows.length > 0) {
                let temp = rows.map((item) => {
                    return {
                        classes: item.folder_name,
                        images: fs.readdirSync(folderImages + '/' + item.folder_name, { withFileTypes: true }).map((file) => {
                            return file.name;
                        })
                    }
                }).filter(itemFilter => itemFilter.images.length > 0);

                resolve(temp);
            }
            resolve(false);
        })
    });
}

const getDataReports = () => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM absensi ORDER BY timestamp DESC", (err, rows, fields) => {
            if (err) {
                console.log(err);
                reject(err)
            }

            resolve(rows);
        })
    })
}

module.exports = {
    checkAbsensi,
    checkIdCard,
    insertUserToDB,
    getDatausers,
    getAllNames,
    getDataReports
}