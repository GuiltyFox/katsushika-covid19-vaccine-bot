
const axios = require('axios');
const cron = require('node-cron');

const target = 'https://api-cache.vaccines.sciseed.jp/public/131229/reservation_frame/';

const config = {
    ignore_single: false, // single shot (1回分予約)
    ignore_double: false, // double shots set (2回分セット予約)
    vaccine: 1 // 1: Pfizer, 2: AstraZeneca, 3: Moderna
}

checkAndNotify();
cron.schedule('*/15 * * * * *', checkAndNotify);


function checkAndNotify() {
    let tomorrow = new Date();
    tomorrow.setHours(24 + 9, 0, 0, 0);

    const start_date_after = tomorrow.toISOString().slice(0, 10);
    let nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 2);
    const start_date_before = nextMonth.toISOString().slice(0, 10);

    console.log('call for', start_date_after, 'to', start_date_before)

    axios.get(target, { params: { item_id: config.vaccine, start_date_after, start_date_before } }).then(response => {
        let available = false;
        if (response.data) {
            let frames = response.data.reservation_frame;
            for (let index = 0; index < frames.length; index++) {
                const element = frames[index];
                if (
                    (!element.next && config.ignore_single) ||
                    (element.next && config.ignore_double)) {
                    continue;
                }

                let startDate = new Date(element.start_at);
                if (element.reservation_cnt_limit - element.reservation_cnt > 0 && startDate > new Date()) {
                    let doubleSingle = element.next != null ? 'double' : 'single';
                    let start_time_no_tz = element.start_at.slice(0, 19);

                    // // MODIFY YOUR NOTIFICATION HERE
                    // let datestring = startDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' });
                    // axios.post(__YOUR_NOTIFY_WEBHOOK_URL__, {
                    //     "msg": `Hey!. ${datestring} has ${doubleSingle} vaccine slot`
                    // }).catch(err => { console.error(err); });

                    available = true;
                    console.log(`${element.reservation_cnt_limit - element.reservation_cnt} [${doubleSingle}] @ ${start_time_no_tz}`);
                }
            }
            if (!available) {
                console.log('Nothing available @', new Date())
            }
        }
    }).catch(err => { console.error(err); });

}