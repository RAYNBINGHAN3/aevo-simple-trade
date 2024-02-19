const fetch = require('node-fetch')
const ethers = require('ethers')


const apiKey = ' ' // https://app.aevo.xyz/settings/api-keys获取
const apiScrect = '' //https://app.aevo.xyz/settings/api-keys获取
const addr = '' //钱包地址
const singK = '' //https://app.aevo.xyz/settings 获取签名密钥
const signer = new ethers.Wallet(singK)

const headers = {
    'AEVO-KEY': apiKey,
    'AEVO-SECRET': apiScrect,
    'accept': 'application/json',
    'content-type': 'application/json'
}

let orderId = null


async function main() {

    while(true){

        
        const position = await getPosition()
        if (position.positions.length > 0) {
         
            const avgPrice = position.positions[0].avg_entry_price
            const makretPrice = position.positions[0].mark_price
    
            console.log('等待成交 。。。。', 'avgPrice', avgPrice, 'makretPrice', makretPrice)
        } else {
            

            // await  setLeverage()
            const quote = await getQuote()
            const price = (quote.price  * 1.15).toFixed(2).toString()
            

            //下单
            const amount = '0.34' //eth amount
            const order = await long(amount, price)
            await sleep(3000)

            const avgPrice = order.avg_price
            //设置止盈单
            await takePro((avgPrice * 1.001).toFixed(6).toString()) //千一
            //设置止损单
            await stopLoss((avgPrice * 0.999).toFixed(6).toString())
    
        }

        await sleep(15000)
    }
}


const sleep = (time) => {
    return new Promise((resovle) => {
        setTimeout(() => {
            resovle(null)
        }, time)
    })
}

async function getQuote(){
     const res = await fetch(
        'https://api.aevo.xyz/index?asset=ETH',
        { method: 'GET', headers: headers }
    )

    return await res.json()

}

async function setLeverage(){

    const data = {
        'instrument': 1, 
        'leverage': 20
    }
    const res = await fetch(
        'https://api.aevo.xyz/account/leverage',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        }
    )

    const result = await res.json()
}


async function getPosition() {
    const res = await fetch(
        'https://api.aevo.xyz/positions',
        { method: 'GET', headers: headers }
    )

    const result = await res.json()

    return result
}

async function long(amount, price) {
    let orderMessage = {
        "isBuy": true,
        "instrument": '1',
        "maker": addr,
        "amount": ethers.utils.parseUnits(amount, 6).toString(), //eth 个数
        "limitPrice": ethers.utils.parseUnits(price, 6).toString(), 
        "salt": Math.floor(Math.random() * 100000).toString(),
        "timestamp": Math.floor(Date.now() / 1000)
    }

    const orderSignature = await signer._signTypedData(
        {
            name: "Aevo Mainnet",
            version: "1",
            chainId: 1,
        },
        {
            Order: [
                { name: "maker", type: "address" },
                { name: "isBuy", type: "bool" },
                { name: "limitPrice", type: "uint256" },
                { name: "amount", type: "uint256" },
                { name: "salt", type: "uint256" },
                { name: "instrument", type: "uint256" },
                { name: "timestamp", type: "uint256" },
            ]
        },
        orderMessage
    );

    const order = {
        "is_buy": orderMessage.isBuy,
        "instrument": orderMessage.instrument,
        "maker": orderMessage.maker,
        "amount": orderMessage.amount,
        "limit_price": orderMessage.limitPrice,
        "salt": orderMessage.salt,
        "signature": orderSignature,
        "timestamp": orderMessage.timestamp
    }


    const res = await fetch(
        'https://api.aevo.xyz/orders',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(order)
        }
    )

    const result = await res.json()

    if(!result.orderId){
        console.log('result', result)
    }


    return result
}

async function takePro(trigger) {

    let orderMessageClose = {
        "isBuy": false,
        "instrument": '1',
        "maker": addr,
        "amount": ethers.utils.parseUnits('0', 6).toString(),
        "limitPrice": ethers.utils.parseUnits('0', 6).toString(),
        "salt": Math.floor(Math.random() * 100000).toString(),
        "timestamp": Math.floor(Date.now() / 1000)
    }

    const orderSignature2 = await signer._signTypedData(
        {
            name: "Aevo Mainnet",
            version: "1",
            chainId: 1,
        },
        {
            Order: [
                { name: "maker", type: "address" },
                { name: "isBuy", type: "bool" },
                { name: "limitPrice", type: "uint256" },
                { name: "amount", type: "uint256" },
                { name: "salt", type: "uint256" },
                { name: "instrument", type: "uint256" },
                { name: "timestamp", type: "uint256" },
            ]
        },
        orderMessageClose
    );

    const order2 = {
        "is_buy": orderMessageClose.isBuy,
        "instrument": orderMessageClose.instrument,
        "maker": orderMessageClose.maker,
        "amount": orderMessageClose.amount,
        "limit_price": orderMessageClose.limitPrice,
        "salt": orderMessageClose.salt,
        "signature": orderSignature2,
        "timestamp": orderMessageClose.timestamp,
        'close_position': true,
        'reduce_only': true,
        'stop': 'TAKE_PROFIT',
        'trigger': ethers.utils.parseUnits(trigger, 6).toString(),
    }
    

    const res2 = await fetch(
        'https://api.aevo.xyz/orders',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(order2)
        }
    )

    const result2 = await res2.json()
    console.log('flace take profile order success', result2.trigger)
}



async function stopLoss(trigger) {


    let orderMessageClose = {
        "isBuy": false,
        "instrument": '1',
        "maker": addr,
        "amount": ethers.utils.parseUnits('0', 6).toString(),
        "limitPrice": ethers.utils.parseUnits('0', 6).toString(),
        "salt": Math.floor(Math.random() * 100000).toString(),
        "timestamp": Math.floor(Date.now() / 1000)
    }

    const orderSignature2 = await signer._signTypedData(
        {
            name: "Aevo Mainnet",
            version: "1",
            chainId: 1,
        },
        {
            Order: [
                { name: "maker", type: "address" },
                { name: "isBuy", type: "bool" },
                { name: "limitPrice", type: "uint256" },
                { name: "amount", type: "uint256" },
                { name: "salt", type: "uint256" },
                { name: "instrument", type: "uint256" },
                { name: "timestamp", type: "uint256" },
            ]
        },
        orderMessageClose
    );

    const order2 = {
        "is_buy": orderMessageClose.isBuy,
        "instrument": orderMessageClose.instrument,
        "maker": orderMessageClose.maker,
        "amount": orderMessageClose.amount,
        "limit_price": orderMessageClose.limitPrice,
        "salt": orderMessageClose.salt,
        "signature": orderSignature2,
        "timestamp": orderMessageClose.timestamp,
        'close_position': true,
        'reduce_only': true,
        'stop': 'STOP_LOSS',
        'trigger': ethers.utils.parseUnits(trigger, 6).toString(),
    }


    const res2 = await fetch(
        'https://api.aevo.xyz/orders',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(order2)
        }
    )

    const result2 = await res2.json()
    console.log('flace stop loss order success', result2.trigger)
}

main()



