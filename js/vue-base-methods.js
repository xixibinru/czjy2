// window.addEventListener('load',function(){
    /* 
        公共方法部分 
    */

    /*---------------------------------------url相关方法------------------------------------------*/

    //获得域名和端口号
    Vue.prototype.$getOrigin = function(){
        if(location.origin){
            return location.origin;
        }else{
            var protocol = location.protocol,
                host = location.host;
            return protocol + host;
        }
    }
    //将对象转为地址栏的search
    Vue.prototype.$objToSearch = function (obj) {
        var k = '',str = '';
        for(k in obj){
            var value = !obj[k]? '' : obj[k];
            str += k + '=' + value + '&';
        }
        return str;
    }

    /*---------------------------------------Date相关方法------------------------------------------*/

    //将时间戳（单位：秒）转成日期格式 isDetail  是否显示详细日期
    Vue.prototype.$formatDate = function (timestamp,isDetail) { //
        var date = new Date(timestamp*1000),
            year = date.getFullYear(),
            month = date.getMonth() + 1,
            day = date.getDate(),
            hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds();
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        var result = year + '/' + month + '/' + day,
            result_detail = year + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' +seconds;
        if(isDetail){
            return result_detail;
        }else {
            return result;
        }
    }

    /*---------------------------------------Array相关方法------------------------------------------*/

    //判断数组中是否有重复的内容
    Vue.prototype.$isRepeatArr = function (arr) {
        for(var i = 0,len = arr.length; i < len; i++){
            if(arr.indexOf(arr[i]) != arr.lastIndexOf(arr[i])){
                return true;
            }
        }
        return false;
    }
    //删除数组中的重复项
    Vue.prototype.$removeRepeat = function (arr) {
        var result = [], hash = {};
        for(var i = 0, len = arr.length; i < len; i++){
            if(!hash[arr[i]]){
                result.splice(result.length,0,arr[i]);
                hash[arr[i]] = true;
            }
        }
        return result;
    }
    //删除数组中的指定值
    Vue.prototype.$removeValue = function (arr,value) {
        for(var i = 0; i < arr.length;){
            if(arr[i] == value){
                arr.splice(i,1);
            }else{
                i++;
            }
        }
    }

    /*---------------------------------------object相关方法------------------------------------------*/

    

    /*---------------------------------------验证填写信息相关方法------------------------------------------*/

    //判断是否存在未填写的数据  obj为需要判断的数据  arr里填写需要判断的属性
    Vue.prototype.$isNotFilled = function (obj, arr) {
        if (arr) {
            var i = 0,
                len =  arr.length;
            for(i; i < len; i++){
                if(obj[arr[i]] == null || obj[arr[i]] === ''){
                    alert('*为必填项,请填写完整');
                    return true;
                }
            }
        }else {
            for(var k in obj){
                if(obj[k] == null) {
                    alert('*为必填项,请填写完整');
                    return true;
                }
            }
        }
        return false;
    }
    //判断是否是身份证
    Vue.prototype.$identity = function (code) {
        var city={11:"北京",12:"天津",13:"河北",14:"山西",15:"内蒙古",21:"辽宁",22:"吉林",23:"黑龙江 ",31:"上海",32:"江苏",33:"浙江",34:"安徽",35:"福建",36:"江西",37:"山东",41:"河南",42:"湖北 ",43:"湖南",44:"广东",45:"广西",46:"海南",50:"重庆",51:"四川",52:"贵州",53:"云南",54:"西藏 ",61:"陕西",62:"甘肃",63:"青海",64:"宁夏",65:"新疆",71:"台湾",81:"香港",82:"澳门",91:"国外 "};
        var tip = "";
        var pass= true;
        if(!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)){
            tip = "身份证号格式错误";
            pass = false;
        }
        else if(!city[code.substr(0,2)]){
            tip = "身份证地址编码错误";
            pass = false;
        }
        else{
            //18位身份证需要验证最后一位校验位
            if(code.length == 18){
                code = code.split('');
                //∑(ai×Wi)(mod 11)
                //加权因子
                var factor = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 ];
                //校验位
                var parity = [ 1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2 ];
                var sum = 0;
                var ai = 0;
                var wi = 0;
                for (var i = 0; i < 17; i++)
                {
                    ai = code[i];
                    wi = factor[i];
                    sum += ai * wi;
                }
                var last = parity[sum % 11];
                if(parity[sum % 11] != code[17]){
                    tip = "身份证校验位错误";
                    pass =false;
                }
            }
        }
        if(!pass) alert(tip);
        return pass;

    }

    /*---------------------------------------上传文件相关方法------------------------------------------*/

    //判断上传的文件是否是图片
    Vue.prototype.$isImage = function (file) {
        if(/image/g.test(file.type)){
            return true;
        }else {
            alert('请上传图片');
            return false;
        }
    }
    //判断上传的文件是否是Excel
    Vue.prototype.$isExcel = function (file) {
        if(!/^.+\.((xls)|(xlsx))$/i.test(file.name) ){
            alert('请上传Excel类型的文件');
            return false;
        }else {
            return true;
        }
    }
    //拿到处理后的base64字符串
    Vue.prototype.$disposeBase64 = function (base64Str) {
        var arr = base64Str.split(';base64,');
        return arr[arr.length-1];
    }












    /* 
        base-component组件相关的方法
    */
    // 得到分页组件返还的 当前是第几页
    Vue.prototype.$getPageNo = function (pageNo,prop) {
        if(prop){
            this[prop].pageNo = pageNo;
        }else{
            this.pageNo = pageNo;
        }
    }
    // 得到时间表组件返还的日期
    Vue.prototype.$getTimes = function (timestamp,prop) {
        if(prop){
            var props = prop.split('.');
            switch(props.length){
                case 1:
                    this[props[0]] = timestamp;
                    break;
                case 2:
                    this[props[0]][props[1]] = timestamp;
                    break;
                case 3:
                    this[props[0]][props[1]][props[2]] = timestamp;
                    break;
            }
        }else {
            this.time = timestamp;
        }
    }





























































    //年月日组件 select版本
    // Vue.component('public-date', {
    //     // date: 传入一个date 设置成这个日期
    //     props: ['date'],
    //     template:
    //     '<div class="date">' +
    //         '<select class="year" v-model="current_year">' +
    //             '<option v-for="year in years">{{year + "年"}}</option>'+
    //         '</select>' +
    //         '<select class="month" v-model="current_month" v-show="current_year !== '+"'全部'"+'">' +
    //             '<option v-for="month in months">{{month + "月"}}</option>'+
    //         '</select>' +
    //         // '<select class="week" v-model="current_week">' +
    //         //     '<option>全部</option>'+
    //         //     '<option v-for="week in weeks">{{"第" + week + "周"}}</option>'+
    //         // '</select>' +
    //         '<select class="day" v-model="current_day">' +
    //             '<option v-for="day in days">{{day + "日"}}</option>'+
    //         '</select>' +
    //     '</div>',
    //     data:function () {
    //         var i=0,
    //             years = [],
    //             months = [1,2,3,4,5,6,7,8,9,10,11,12],
    //             now = new Date(), //服务器时间为准
    //             nowYear = now.getFullYear(),
    //             nowMonth = now.getMonth()+1,
    //             nowday = now.getDate();
    //         // nowWeek = Math.ceil(nowday/7);
    //         for(i=nowYear+20;i>1900;i--){
    //             years[years.length] = i;
    //         }
    //         return {
    //             years: years,
    //             months: months,
    //             current_year: nowYear + '年',
    //             current_month: nowMonth + '月',
    //             // current_week:'第'+ nowWeek + '周',
    //             current_day: nowday + '日'
    //         }
    //     },
    //     computed:{
    //         // weeks:function () {
    //         //     var current_month = parseInt(this.current_month),
    //         //         current_year = parseInt(this.current_year),
    //         //         arr = [],
    //         //         i = 1;
    //         //         len = 0;
    //         //     if(current_month !== 2 || current_year % 4 === 0){
    //         //         len = 5;
    //         //     }else{
    //         //         len = 4
    //         //     }
    //         //     for(i=1;i<=len;i++){
    //         //         arr[arr.length] = i;
    //         //     }
    //         //     return arr;
    //         // },
    //         days:function () {
    //             var current_month = parseInt(this.current_month),
    //                 current_year = parseInt(this.current_year),
    //                 arr = [],
    //                 i = 1,
    //                 len = 0;
    //             switch(current_month){
    //                 case 1:
    //                 case 3:
    //                 case 5:
    //                 case 7:
    //                 case 8:
    //                 case 10:
    //                 case 12:
    //                     len = 31;
    //                     break;
    //                 case 4:
    //                 case 6:
    //                 case 9:
    //                 case 11:
    //                     len = 30;
    //                     break;
    //                 case 2:
    //                     if(current_year % 4 === 0){
    //                         len = 29;
    //                     }else{
    //                         len = 28;
    //                     }
    //                     break;
    //             }
    //             for(i=1;i<=len;i++){
    //                 arr[arr.length] = i;
    //             }
    //             return arr ;
    //         },
    //         //计算当前选择的时间戳(单位:秒)
    //         current_timestamp:function () {
    //             var year = parseInt(this.current_year),
    //                 month = parseInt(this.current_month),
    //                 day = parseInt(this.current_day),
    //                 timestamp = new Date(year,month-1,day);
    //             return timestamp.getTime()/1000; //以秒为单位
    //         }
    //     },
    //     methods: {
    //         //传递当前选择日期的时间戳或日期
    //         giveTimes:function () {
    //             // var date = new Date(this.current_timestamp*1000).toLocaleDateString();
    //             var date = Vue.prototype.$formatDate(this.current_timestamp*1000);
    //             this.$emit('giveTimes',this.current_timestamp,date);
    //         }
    //     },
    //     watch: {
    //         current_timestamp:function () {
    //             this.giveTimes();
    //         }
    //     },
    //     created:function () {
    //         this.giveTimes();
    //         if(this.date){
    //             var date = new Date(this.date*1000);
    //             this.current_year = date.getFullYear() + '年';
    //             this.current_month = date.getMonth() + 1 + '月';
    //             this.current_day = date.getDate() + '日';
    //         }
    //     }
    // });
// });