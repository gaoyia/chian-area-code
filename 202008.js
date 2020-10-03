const fs = require('fs')
var path = require('path');
var file = path.join(__dirname, 'source/mca/202008.json');
let allData = JSON.parse(fs.readFileSync(file, 'utf-8'))



allData.forEach(item => {
    let probinceNo = item.value.slice(0,2)
    let cityNo = item.value.slice(2,4)
    let regionNo = item.value.slice(4,6)
    item.probinceNo = probinceNo
    item.cityNo = cityNo
    item.regionNo = regionNo
});



// 省数据
let allProvince = allData.filter(i=>{
    return i.cityNo === "00" && i.regionNo === "00"
})

// 市数据添加到省数据 
allData.forEach(item => {

    let province = allProvince.find(i=>{
        return i.probinceNo === item.probinceNo
    })
    // 如果找到，说明这条数据是市的数据
    if (province && item.cityNo !== "00" && item.regionNo === "00") {

        if (!province.children) {
            province.children = []
        }
        province.children.push(JSON.parse(JSON.stringify(item)))
    }
})

// 给北京市，重庆市，天津市，上海市，手动添加直辖市子节点，后续修正代码
let municipality = allProvince.filter(i=>{
    return i.probinceNo === "11" || i.probinceNo === "12" || i.probinceNo === "31" || i.probinceNo === "50"
})
municipality.forEach(i=>{
    let newObj = JSON.parse(JSON.stringify(i))
    newObj.cityNo = "01"
    newObj.municipality = true
    newObj.value = newObj.probinceNo + newObj.cityNo + newObj.regionNo
    i.children = [newObj]
})

// 香港810000，澳门820000，台湾710000，
let otherRegions = allProvince.filter(i=>{
    return i.probinceNo === "71" || i.probinceNo === "81" || i.probinceNo === "82"
})
otherRegions.forEach(i=>{
    let newObj = JSON.parse(JSON.stringify(i))
    newObj.children = [JSON.parse(JSON.stringify(i))]
    i.children = [newObj]
})

// 区数据添加到市数据
allData.forEach(item => {
    // 先找到对应的省
    let province = allProvince.find(i=>{
        return i.probinceNo === item.probinceNo
    })

    if (province.children) {
        let city = province.children.find(city=>{
            return city.cityNo === item.cityNo
        })
        if (city) {
            if (!(city.children)) {
                city.children = []
            }
            if (item.regionNo !== "00") {
                city.children.push(JSON.parse(JSON.stringify(item)))
            }
        }
        
    }
})

// 修复直辖市（city级别）的value值
municipality.forEach(item=>{
    item.children[0].value = item.children[0].probinceNo+"0000"
    item.children[0].cityNo = "00"
})



// provinceData 输出省的列表
let provinceData = []
allProvince.forEach(province=>{
    // 输出省的数据
    provinceData.push({
        value: province.value,
        label: province.label,
    })
    // 建立省的文件夹
    if (!fs.existsSync('data/mca/202008/' + province.probinceNo)) {
        fs.mkdirSync('data/mca/202008/' + province.probinceNo)
    }
    // 设置保留市的变量
    let cityData = []
    // 循环省的数据到处市的数据
    province.children.forEach(city=>{
        cityData.push({
            value: city.value,
            label: city.label,
            // municipality: city.municipality?true:false
        })
        // 定义保存区的数据
        let regionData = []
        // 循环市的数据输出到区的数据
        city.children.forEach(region=>{
            regionData.push({
                value: region.value,
                label: region.label,
            })
        })
        // 输出区的数据
        let str = JSON.stringify(regionData,null,"\t")
        fs.writeFile('data/mca/202008/' + province.probinceNo +'/'+ city.cityNo  +'.json',str,function(err){
            if (err) {console.error('Server is error...')}
        })
    })
    // 输出市的数据
    let str = JSON.stringify(cityData,null,"\t")
    fs.writeFile('data/mca/202008/' + province.probinceNo + '.json',str,function(err){
        if (err) {console.error('Server is error...')}
    })
})
// 输出省的数据
str = JSON.stringify(provinceData,null,"\t")
fs.writeFile('data/mca/202008/province.json',str,function(err){
    if (err) {console.error('Server is error...')}
})


// 输出全部数据
let all = JSON.parse(JSON.stringify(allProvince))
function getAll(data) {
    data.forEach(item=>{
        delete item.cityNo
        delete item.probinceNo
        delete item.regionNo
        delete item.municipality
        if (item.children) {
            getAll(item.children)
        }
    })
        
    
}
getAll(all)

str = JSON.stringify(all,null,"\t")
fs.writeFile('data/mca/202008/all.json',str,function(err){
    if (err) {console.error('Server is error...')}
})