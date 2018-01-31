// nav左侧导航滑动效果

$(function () {
    $('#nav').on('click', '.sidebar-title', function () {
        $(this).addClass('current').siblings('.sidebar-title').removeClass('current')
        $(this).next().stop().slideToggle().siblings('.sidebar-content').stop().slideUp();
        $(this).children('span').toggleClass('current').end().siblings('.sidebar-title').children('span').removeClass('current');
    });
    $('#nav .sidebar-content').on('click','li',function () {
        $(this).addClass('current').siblings().removeClass('current').end().parent().siblings('.sidebar-content').children('li').removeClass('current');
        $(this).children('a').addClass('current');
    });
});
(function (window, document) {
        //全局省市区
    if(sessionStorage.info){
        var info = JSON.parse(sessionStorage.info),
            token = info.token;
    }
    var url = Vue.prototype.$getOrigin();
    var baseUrl = url + '/agent';
    var address3 = {
            data: $.ajax({
                url: '../data/address3.json',
                success: function(data){
                    return data;
                },
                async: false
            }).responseJSON,
            current_province: info.province, //初始化下拉框
            current_city: !info.city ? '城市' : info.city,
            current_counties: !info.countries ? '县区' : info.countries,
            province: null,
            city: null,
            counties: null,
            grade: '未选择',
            province_isWritable: info.province !== null, //下拉框能否选择
            city_isWritable: info.city !== null,
            counties_isWritable: info.countries !== null
        },
        kindergartens = {
            data:[],
            name: '幼儿园',
            id: null
        },
        agents = {
            data:[],
            name: '代理商',
            id: null
        };

    // 得到幼儿园类型
    Vue.prototype.$getGartenType = function ($event) {
        this.gartenType = $event[0];
    }

    //三级联动组件 加载时即获取数据  想用父元素访问子组件需要给组件上添加ref="xxx" 父组件.$refs.xxx.（data里的属性） 即可访问数据
    Vue.component('public-address3',{
        props:['disable'],
        template: 
        '<div class="address3" @change="select_defaultValue($event)">' +
            '<select :disabled="province_isWritable"  name="province" v-model="current_province">' +
                '<option v-for="(value,province,index) in data" :key="index" >{{province}}</option>' +
            '</select>' +
            '<select :disabled="city_isWritable" v-show="current_province !== '+"'省份'"+'" name="city" v-model="current_city">' +
                '<option>城市</option>' +
                '<option v-for="(value,city) in data[current_province]">{{city}}</option>'+
            '</select>' +
            '<select :disabled="counties_isWritable"  name="counties" v-model="current_counties" v-show="current_city !== '+"'城市'"+'">' +
                '<option>县区</option>' +
                '<option v-for="counties in data[current_province][current_city]"  >{{counties}}</option>'+
            '</select>' +
        '</div>',
        data:function () {
            return address3;
        },
        methods:{
            select_defaultValue:function (e) {
                var target = e.target.name;
                switch(target){
                    case 'province':
                        this.current_city = '城市';
                        this.current_counties = '县区';
                    case 'city':
                        this.current_counties = '县区';
                }
            }
        },
        computed:{
            current_grade: function () {
                if(this.counties){
                    return '三级';
                }else if (this.city){
                    return '二级';
                }else if (this.province){
                    return '一级';
                }else {
                    return '未选择';
                }
            }
        },
        watch:{
            current_province: function () {
                this.province = this.current_province === '省份'? null:this.current_province;

            },
            current_city: function () {
                this.current_city = !this.current_city? '城市' : this.current_city;
                this.city = this.current_city === '城市'? null:this.current_city;
            },
            current_counties: function () {
                this.current_counties = !this.current_counties ? '城市' : this.current_counties;
                this.counties = this.current_counties === '县区'? null:this.current_counties;
            },
            current_grade: function () {
                this.grade = this.current_grade;
            }
        },
        mounted: function () {
            this.province = this.current_province === '省份'? null:this.current_province;
            this.city = this.current_city === '城市'? null:this.current_city;
            this.counties = this.current_counties === '县区'? null:this.current_counties;
        }
    });
    //代理商组件
    Vue.component('public-agents',function (resolve,reject) {
        function success(data) {
            agents.data = data.info.map(function(item,index){
                return {
                    name: item.agentName,
                    id: item.agentId
                }
            });
        }
         $.ajax({
             url: baseUrl + '/childAgentNoPage.do',
             data: {
                 token: token,
             },
             type: 'post',
             success: function (data) {
                 if( data.state !== 1 ) return;
                 success(data);
                 // resolve({
                 //    template:
                 //        '<select v-model="id">' +
                 //            '<option :value="null">代理商</option>' +
                 //            '<option v-for="agent in data" :key="agent.id" :value="agent.id">{{agent.name}}</option>' +
                 //        '</select>',
                 //    data:function () {
                 //        return agents;
                 //    }
                 // });
             }
         });
    });

    //代理商幼儿园组件
    Vue.component('public-kindergartens',function (resolve,reject) {
        $.ajax({
            url: baseUrl + '/agentGarten.do',
            data: {
                token: token,
            },
            type: 'post',
            success: function (data) {
                kindergartens.data = data.info
                resolve({
                    template:
                    '<select v-model="id">' +
                    '<option :value="null">幼儿园</option>' +
                    '<option v-for="kindergarten in data" :value="kindergarten.gartenId">{{kindergarten.gartenName}}</option>' +
                    '</select>',
                    data:function () {
                        return kindergartens;
                    }
                });
            }
        });

    });
    //幼儿园类型组件
    Vue.component('public-gartenType',{
        props: ['gartenType'],
        template:
        '<select v-model="id">' +
            '<option :value="null">幼儿园类型</option>'+
            '<option v-for="item in data" :value="item.id">{{item.name}}</option>'+
        '</select>',
        data: function () {
            return {
                data: [],
                id: null,
            }
        },
        watch: {
            id: function () {
                this.$emit('giveGartenType',[this.id]);
            }
        },
        beforeCreate: function () {
            var self = this;
            $.ajax({
                url: url + '/bigcontrol/findGartentype.do',
                data: {
                    pageNo: 1
                },
                type: 'get',
                success: function (data) {
                    if(data.state){
                        self.data = data.info.map(function (item) {
                            return {
                                name: item.typeName,
                                id: item.gartenType
                            }
                        });
                    }
                }
            });
        },
        created: function () {
            if(this.gartenType){
                this.id = this.gartenType;
            }
        }
    });

    /*---------------------------------------*/
    //信息管理
    var infoManage = Vue.component('info-manage',{
        template:
            '<div>' +
                '<div class="nav">' +
                    '<div class="current">个人信息</div>'+
                '</div>'+
                '<div class="look-Detaildata" v-if="detail_data">' +
                    '<h3>代理商个人信息:</h3>'+
                    '<div>代理商名称: <input disabled v-model="detail_data.agentName" type="text"></div>'+
                    '<div>代理商手机号: <input disabled v-model="detail_data.phoneNumber" type="text"></div>'+
                    '<div>代理开始时间: <input disabled :value="$formatDate(detail_data.agentStartTime)" type="text"></div>'+
                    '<div>代理结束时间: <input disabled :value="$formatDate(detail_data.agentEndTime)" type="text"></div>'+
                    '<div>代理区域: <input disabled :value="(detail_data.province + detail_data.city + detail_data.countries).replace(/null/g,'+"''"+')" type="text"></div>'+
                    '<div>代理等级: <input disabled :value="detail_data.agentGrade" type="text"></div>'+
                    '<div>代理费: <input disabled :value="detail_data.agentMoney" type="text"></div>'+
                    '<div>信用额度: <input disabled :value="detail_data.creditMoney" type="text"></div>'+
                    '<div>返佣比例: <input disabled :value="detail_data.rebate" type="text"></div>'+
                    '<div>提现方式: ' +
                        '<select disabled v-model="detail_data.receiveType">' +
                            '<option :value="null">未选择</option>'+
                            '<option value="0">支付宝</option>'+
                            '<option value="1">银行卡</option>'+
                        '</select>' +
                    '</div>'+
                    '<div>卡号(银行卡或支付宝): <input disabled v-model="detail_data.card" type="text"></div>'+
                    '<div>户主姓名: <input disabled v-model="detail_data.cardName" type="text"></div>'+
                    '<div>代理商考勤卡号段: <input disabled :value="detail_data.cardFragment" type="text"></div>'+
                    '<div>冻结状态: <input disabled :value="detail_data.frost == 0 ? '+"'正常':'冻结中'"+'" type="text"></div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                detail_data: null,
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/agentMessage.do',
                    data: {
                        token: token
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.detail_data = item = data.info;
                        }
                    }
                }
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    //信用额度管理
    var buyCreditMoney = Vue.component('buy-creditMoney',{
        template:
            '<div class="creditMoneyManage">' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'购买信用额度'"+'}">购买信用额度</div>'+
                    '<div :class="{current: show_current == '+"'购买记录'"+'}">购买记录</div>'+
                '</div>'+
                '<div v-show="show_current=='+"'购买记录'"+'">' +
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                '</div>'+
                '<div class="add-Newdata" v-show="show_current=='+"'购买信用额度'"+'">' +
                    '<div>购买金额: <input v-model="price" type="text" ></div>'+
                    '<div>支付类型: ' +
                        '<label for="ali_pay"><input v-model="type" :value="1" name="pay" id="ali_pay" type="radio"><img src="images/pay_ali.png" alt=""><span style="color:#01aaed">支付宝支付</span></label>' +
                        '<label for="wechat_pay"><input v-model="type" :value="2" name="pay" id="wechat_pay" type="radio"><img src="images/pay_wechat.png" alt=""><span style="color:#3ab133">微信支付</span></label>' +
                        '<button @click="buyCreditMoney">去支付</button>'+
                        '<div class="look-Detaildata" v-if="show_qrcode">' +
                            '<h3>微信扫一扫付款</h3>'+
                            '<div id="qrcode"></div>'+
                            '<div class="postData"><input class="clear" @click="cancelPay" value="取消" type="button"></div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                price: '',
                type: 2, // 1 为支付宝 2为微信
                show_current: '购买记录',
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['订单编号','订单价格','下单时间','订单内容','支付类型','支付状态','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                show_qrcode: false,
                timer: null
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findAgentOrder.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem =  self.responseData.map(function (item,index) {
                                return {
                                    orderNumber: item.orderNumber,
                                    price: item.price,
                                    registTime: self.$formatDate(item.orderNumber/1000,true),
                                    orderDetail: item.orderDetail,
                                    get payType(){
                                        switch(item.payType){
                                            case 0:
                                                return '支付宝';
                                                break;
                                            case 1:
                                                return '微信支付';
                                                break;
                                        }
                                    },
                                    get state(){
                                        switch(item.state){
                                            case 0:
                                                return '未支付';
                                                break;
                                            case 1:
                                                return '已支付';
                                                break;
                                        }
                                    },
                                    operation: {
                                        action: ['删除']
                                    }
                                }
                            });
                        }
                    }
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(购买信用额度|购买记录)$/.test(target)){
                    this.show_current = target;
                }
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch (value) {
                    case '删除':
                        confirm('是否确认删除') &&
                            $.ajax({
                                url: baseUrl + '/deleteAgentOrder.do',
                                data: {
                                    orderNumber: this.detail_data.orderNumber
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                    }
                                }
                            })
                        break;
                }
            },
            buyCreditMoney: function () {
                var self = this;
                if(!this.price){
                    alert('未填写购买款金额');
                    return;
                }
                switch(this.type){
                    case 1:
                        location.href = baseUrl + '/alipay.do?price=' + this.price + '&token=' + token;
                        break;
                    case 2:
                        this.show_qrcode = true;
                        $.ajax({
                            url: baseUrl + '/wxpay.do',
                            data: {
                                token: token,
                                price: this.price
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    var url = data.info.url;
                                    var qrcode =  new QRCode('qrcode',{
                                        text: url,
                                        width: 208,
                                        height: 208,
                                        colorDark : '#000000',
                                        colorLight : '#ffffff',
                                        correctLevel : QRCode.CorrectLevel.H
                                    });
                                    this.timer = setInterval(function () {
                                        if(location.hash !== '#/creditMoneyManage'){
                                            clearInterval(this.timer);
                                            return;
                                        }
                                        $.ajax({
                                            url: baseUrl + '/findAgentOrderOne.do',
                                            data: {
                                                orderNumber: data.info.orderNumber
                                            },
                                            type: 'post',
                                            success: function (data) {
                                                if(data.state){
                                                    if(data.info.state){
                                                        clearInterval(this.timer);
                                                        $.ajax(self.xhr);
                                                        alert('支付成功');
                                                        self.show_qrcode = false;
                                                        self.show_current = '购买记录';
                                                    }
                                                }
                                            }
                                        });
                                    },3000);
                                }
                            }
                        });
                        break;
                }
            },
            cancelPay: function () {
                this.show_qrcode = false;
                clearInterval(this.timer);
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    //提现管理
    var applyMoney = Vue.component('apply-money',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'提现列表'"+'}">提现列表</div>'+
                    '<div :class="{current: show_current == '+"'申请提现'"+'}">申请提现</div>'+
                '</div>'+
                '<div v-show="show_current=='+"'提现列表'"+'">' +
                    '<div class="filter">' +
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                '</div>'+
                '<div class="add-Newdata" v-show="show_current=='+"'申请提现'"+'">' +
                    '<h3>申请提现</h3>'+
                    '<div>*提现方式: ' +
                        '<select v-model="apply_money.receiveType">' +
                            '<option :value="null">未选择</option>'+
                            '<option value="0">支付宝</option>'+
                            '<option value="1">银行卡</option>'+
                        '</select>' +
                    '</div>'+
                    '<div>*提现金额: <input v-model="apply_money.price" type="text"></div>'+
                    '<div>*卡号(银行卡或支付宝): <input v-model="apply_money.card" type="text"></div>'+
                    '<div>*户主姓名: <input v-model="apply_money.cardName" type="text"></div>'+
                    '<div class="postData">' +
                        '<input @click="applyMoney" type="button" value="提交" class="save">'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                apply_money: {
                    token: token,
                    card: info.card,
                    cardName: info.cardName,
                    receiveType: info.receiveType,
                    price: ''
                },
                show_current: '提现列表',
                startTime: 0,
                endTime: 0,
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['申请日期','提现方式','申请金额','申请状态','备注','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findWithdraw.do',
                    data: {
                        token: token,
                        startTime: this.startTime,
                        endTime: this.endTime
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.responseData = data.info;
                            var tableItem = self.responseData.map(function (item,index) {
                                 return {
                                     registTime: self.$formatDate(item.registTime,true),
                                     receiveType: item.receiveType == 0 ? '支付宝': '银行卡',
                                     price: item.price,
                                     get state(){
                                         switch(item.state){
                                             case 0:
                                                 return '未处理';
                                             case 1:
                                                 return '已转账';
                                             case 2:
                                                 return '已拒绝';
                                         }
                                     },
                                     mark: item.mark,
                                     operation: {
                                         action: ['删除']
                                     }
                                 }
                            });
                            self.tableItem = tableItem;
                        }
                    }
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(申请提现|提现列表)$/.test(target)){
                    this.show_current = target;
                }
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '删除':
                        confirm('是否确认删除') &&
                        $.ajax({
                            url: baseUrl + '/deleteWithdraw.do',
                            data: {
                                token: token,
                                withdrawId:this.detail_data.withdrawId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    $.ajax(self.xhr);
                                    alert('删除成功');
                                }
                            }
                        })
                        break;
                }
            },
            applyMoney: function () {
                var self = this;
                if(this.$isNotFilled(this.apply_money)) return;

                $.ajax({
                    url: baseUrl + '/addWithdraw.do',
                    data: this.apply_money,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                self.show_current = '提现列表';
                                alert('申请成功');
                                break;
                            case 5:
                                alert('信用额度不足');
                                break;
                        }
                    }
                });
            }
        }
    });

    // 子代理列表
    var agentList = Vue.component('agent-list',{
       template:
           '<div class="agentList">' +
                '<div class="nav">' +
                    '<div class="current">子代理列表</div>'+
                '</div>'+
                '<div class="filter">' +
                    '代理等级: ' +
                    '<select v-model="type">' +
                        '<option v-if="agentGrade == 1" :value="1">市级子代理</option>'+
                        '<option :value="2">区县级子代理</option>'+
                    '</select>'+
                '</div>'+
                '<public-table :title="agents.tableTitle" :item="agents.tableItem" :itemCount="16-agents.tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
                '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="show_detail">'+
                    '<h3>代理商详情详情: </h3>'+
                    '<div>代理商名称: <input :value="agent_detail.agentName" disabled type="text"></div>'+
                    '<div>代理区域: <input :value="agent_detail.province+agent_detail.city+agent_detail.countries" disabled type="text"></div>'+
                    '<div>代理等级: <input :value="agent_detail.agentGrade" disabled type="text"></div>'+
                    '<div>客户数量: <input :value="agent_detail.gartenCount" disabled type="text"></div>'+
                    '<div>视频开通量: <input :value="agent_detail.gartenMonitorCount" disabled type="text"></div>'+
                    '<div>考勤开通量: <input :value="agent_detail.gartenAttendanceCount" disabled type="text"></div>'+
                    '<div>加盟起始时间: <input :value="$formatDate(agent_detail.agentStartTime)" disabled type="text"></div>'+
                    '<div>加盟结束时间: <input :value="$formatDate(agent_detail.agentEndTime)" disabled type="text"></div>'+
                    '<div>加盟费用: <input :value="agent_detail.agentMoney" disabled type="text"></div>'+
                    '<div>可用信用额度: <input :value="agent_detail.creditMoney" disabled type="text"></div>'+
                    '<div>返佣比例: <input :value="agent_detail.rebate" disabled type="text"></div>'+
                    '<h3>幼儿园详情: </h3>'+
                    '<public-table :title="agent_kindegartens.tableTitle" :item="agent_kindegartens.tableItem"></public-table>'+
                    '<div class="look"><input @click="clear_detail" class="clear" type="button" value="关闭"></div>'+
                '</div>'+
           '</div>',
        data:function () {
            return {
                agentGrade: info.agentGrade,
                type: this.agentGrade == 1 ? 1 : 2,
                pageNo: 1,
                pageCount: 1,
                show_detail: false,
                responseData:[],
                agent_detail:null,
                agents: {
                    tableTitle: ['代理商名称', '代理区域', '客户数量', '视频开通', '考勤开通', '加盟费用', '可用信用额度', '返佣比例%', '隐藏', '操作'],
                    tableItem: []
                },
                agent_kindegartens: {
                    tableTitle: ['幼儿园名称', '视频开通量', '考勤开通量'],
                    tableItem: []
                }
            };
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/childAgent.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        type: this.type
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        var tableItem = [];
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.responseData.forEach(function (item,index) {
                            var agent = {};
                            agent.agentName = item.agentName;
                            agent.agentArea = (item.province + item.city + item.countries).replace(/null/g,'');;
                            agent.clientCount = item.gartenCount;
                            agent.monitorCount = item.gartenMonitorCount;
                            agent.attendanceCount = item.gartenAttendanceCount;
                            agent.JoinMoney = item.agentMoney;
                            agent.creditMoney = item.creditMoney;
                            agent.commissionRatio = item.rebate;
                            agent.operation = {
                                action: ['查看']
                            }
                            tableItem[index] = agent;
                        });
                        self.agents.tableItem = tableItem;
                    }
                }
            }
        },
        watch: {
           xhr: function () {
               $.ajax(this.xhr);
           }
        },
        methods:{
            getPageNo: Vue.prototype.$getPageNo,
            getOperation:function (index,value) {
                var self = this;
                this.agent_detail = this.responseData[index];
                switch(value){
                    case '查看':
                        $.ajax({
                            url: baseUrl + '/getGartenDetail.do',
                            data: {
                                token: token,
                                agentId: self.agent_detail.agentId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                self.agent_kindegartens.tableItem = data.info.map(function (item,index) {
                                    return {
                                        name: item.gartenName,
                                        monitorCount: item.monitorCount,
                                        attendanceCount: item.attendanceCount
                                    }
                                });
                            }
                        });
                        this.show_detail = true;
                        break;
                }
            },
            clear_detail:function () {
                this.show_detail = false;
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 子代理业绩统计
    var performanceStatistics = Vue.component('performance-statistics',{
        template:
        '<div class="performanceStatistics">' +
            '<div class="filter">' +
                '<public-address3></public-address3>' +
                '<public-agents></public-agents>' +
                '代理等级: ' +
                '<select v-model="type">' +
                    '<option v-if="agentGrade == 1" :value="1">市级子代理</option>'+
                    '<option :value="2">区县级子代理</option>'+
                '</select>'+
            '</div>' +
            '<public-table  :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
        '</div>',
        data:function () {
            return {
                type: info.agentGrade == 1 ? 1 : 2,
                agentGrade: info.agentGrade,
                pageNo: 1,
                pageCount: 1,
                tableTitle:['幼儿园名称','手机号','注册时间','合同编号','开园状态'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/childAgentBusiness.do',
                    data: {
                        token: token,
                        agentId: agents.id,
                        pageNo: this.pageNo,
                        type: this.type
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !==1) return;
                        var tableItem = [];
                        self.pageCount = data.info.pageCount;
                        data.info.list.forEach(function(item,index){
                            var kindergarten = {
                                name: item.gartenName,
                                phoneNumber: item.phoneNumber,
                                registTime: self.$formatDate(item.registTime),
                                contractNumber: item.contractNumber,
                                state: item.state === 0 ? '未通过' : '通过'
                            };
                            tableItem[index] = kindergarten;
                        });
                        self.tableItem = tableItem;
                    }
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getPageNo: Vue.prototype.$getPageNo
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 幼儿园管理
    var kindergartenManage = Vue.component('kindergarten-manage',{
        template:
        '<div class="kindergartenManage">'+
            '<div class="filter">' +
                '幼儿园名称: <input v-model="gartenName" type="text">'+
                '手机: <input v-model="phoneNumber" class="phoneNumber" type="text">'+
            '</div>'+
            '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>' +
            '<public-paging :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>'+
            '<div class="look-Detaildata" v-if="show_detail">'+
                '<h3>幼儿园详细信息</h3>'+
                '<div>注册时间: <input type="text" :value="$formatDate(kindergarten_detail.registTime)" disabled></div>'+
                '<div>幼儿园名: <input type="text" :value="kindergarten_detail.gartenName" disabled></div>'+
                '<div>幼儿园ID: <input type="text" :value="kindergarten_detail.gartenId" disabled></div>'+
                '<div>联系人: <input type="text" :value="kindergarten_detail.name" disabled></div>'+
                '<div>联系方式: <input type="text" :value="kindergarten_detail.phoneNumber" disabled></div>'+
                '<div>合同编号: <input type="text" :value="kindergarten_detail.contractNumber" disabled></div>'+
                '<div>合同起始日期: <input type="text" :value="$formatDate(kindergarten_detail.contractStart)" disabled></div>'+
                '<div>合同截止日期: <input type="text" :value="$formatDate(kindergarten_detail.contractEnd)" disabled></div>'+
                '<div>省份: <input type="text" :value="kindergarten_detail.province" disabled></div>'+
                '<div>城市: <input type="text" :value="kindergarten_detail.city" disabled></div>'+
                '<div>县区: <input type="text" :value="kindergarten_detail.countries" disabled></div>'+
                '<div>详细地址: <input type="text" :value="kindergarten_detail.address" disabled></div>'+
                '<div>冻结状态: ' +
                '<select disabled :value="kindergarten_detail.accountState">' +
                '<option :value="0">正常</option>'+
                '<option :value="1">冻结中</option>'+
                '</select>'+
                '</div>'+
                '<div>幼儿园学费标准: <input type="text" :value="null" disabled></div>'+
                '<div>幼儿园视频截止日期: <input type="text" :value="$formatDate(kindergarten_detail.monitorTime)" disabled></div>'+
                '<div>幼儿园考勤截止日期: <input type="text" :value="$formatDate(kindergarten_detail.attendanceTime)" disabled></div>'+
                '<div class="look"><input class="save" type="button" value="保存"><input @click="clear_detail" class="clear" type="button" value="关闭"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                gartenName: '',
                phoneNumber: '',
                pageNo: 1,
                pageCount: 1,
                responseData: null,
                kindergarten_detail: null,
                show_detail:false, //是否显示幼儿园详细信息
                tableTitle: ['幼儿园', '联系人','联系方式', '注册时间', '合同起始日期','合同截止日期','隐藏', '操作'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/gartenManage.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        name: this.gartenName,
                        phoneNumber: this.phoneNumber,
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        var tableItem = [];
                        self.responseData.forEach(function (item,index) {
                            var agent = {};
                            agent.kindergarten = item.gartenName ;
                            agent.agentPerson = item.name ;
                            agent.phoneNumber = item.phoneNumber ;
                            agent.registerTime = self.$formatDate(item.registTime) ;
                            agent.contractStartDate = self.$formatDate(item.contractStart );
                            agent.contractEndDate = self.$formatDate(item.contractEnd );
                            agent.operation = {
                                action:['查看']
                            }
                            tableItem[index] = agent;
                        });
                        self.tableItem = tableItem;
                    }
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getPageNo: Vue.prototype.$getPageNo,
            getOperation:function (index,value) {
                this.kindergarten_detail = this.responseData[index];
                switch(value){
                    case '查看':
                    this.show_detail = true;
                }
            },
            clear_detail:function () {
                this.show_detail = false;
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 开园申请
    var kindergartenApply = Vue.component('kindergarten-apply',{
        template:
        '<div class="kindergartenApply">' +
            '<div class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_current === '+"'开园申请列表'"+'}">开园申请列表</div>'+
                '<div :class="{current:show_current === '+"'开园申请'"+'}">开园申请</div>'+
            '</div>'+
            '<div v-show="show_current==='+"'开园申请列表'"+'">' +
                '<public-table  :title="applyList.tableTitle" :item="applyList.tableItem" :itemCount="16-applyList.tableItem.length" v-on:giveOperation="getOperation"></public-table>' +
                '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="show_detail">'+
                    '<h3>开园申请信息</h3>'+
                    '<div>幼儿园名: <input :value="apply_detail.gartenName" type="text" disabled></div>'+
                    '<div>幼儿园类型: <public-gartenType disabled :gartenType="apply_detail.gartenType" @giveGartenType="getGartenType($event,'+"'applyData'"+')"></public-gartenType></div>'+
                    '<div>联系人: <input disabled :value="apply_detail.name" type="text" ></div>'+
                    '<div>联系方式: <input disabled :value="apply_detail.phoneNumber" type="text" ></div>'+
                    '<div>合同编号: <input :value="apply_detail.contractNumber" type="text" disabled></div>'+
                    '<div>*省市区: <public-address3 disabled></public-address3></div>'+
                    '<div>开园费用: <input :value="apply_detail.money1" type="text" disabled></div>'+
                    '<div>使用设备: <input :value="apply_detail.equipment" type="text" disabled></div>'+
                    '<div>老师人数: <input :value="apply_detail.workerCount" type="text" disabled></div>'+
                    '<div>宝宝人数: <input :value="apply_detail.babyCount" type="text" disabled></div>'+
                    '<div>年级数: <input :value="apply_detail.gradeCount" type="text" disabled></div>'+
                    '<div>班级数: <input :value="apply_detail.classCount" type="text" disabled></div>'+
                    '<div>备注: <input :value="apply_detail.remark" type="text" disabled></div>'+
                    '<div><input @click="show_detail=false" class="clear" type="button" value="关闭"></div>'+
                '</div>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current==='+"'开园申请'"+'">' +
                '<h3>开园申请</h3>'+
                '<div>幼儿园名: <input v-model="applyData.gartenName" type="text" ></div>'+
                '<div>幼儿园类型: <public-gartenType @giveGartenType="getGartenType($event,'+"'applyData'"+')"></public-gartenType></div>'+
                '<div>联系人: <input v-model="applyData.name" type="text" ></div>'+
                '<div>联系方式: <input v-model="applyData.phoneNumber" type="text" ></div>'+
                '<div>合同编号: <input v-model="applyData.contractNumber" type="text" ></div>'+
                '<p class="mark">注: 开园申请审核通过后需在 幼儿园管理板块→修改 填写合同起止日期</p>'+
                '<div>省市区: <public-address3></public-address3></div>'+
                '<div>开园费用: <input v-model="applyData.money1" type="text" ></div>'+
                '<div>使用设备: <input v-model="applyData.equipment" type="text" ></div>'+
                '<div>老师人数: <input v-model="applyData.workerCount" type="text" ></div>'+
                '<div>宝宝人数: <input v-model="applyData.babyCount" type="text" ></div>'+
                '<div>年级数: <input v-model="applyData.gradeCount" type="text" ></div>'+
                '<div>班级数: <input v-model="applyData.classCount" type="text" ></div>'+
                '<div>备注: <input v-model="applyData.remark" type="text"></div>'+
                '<div><input class="save" @click="addApply" type="button" value="保存"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                pageNo: 1,
                pageCount: 1,
                show_current: '',
                show_detail: false,
                responseData: null,
                applyData: {
                    token: token,
                    gartenName: '',
                    gartenType: null,
                    name: '',
                    phoneNumber: '',
                    contractNumber: '',
                    province: '',
                    city: '',
                    countries: '',
                    childCount: '',
                    count: '',
                    gradeCount: '',
                    classCount: '',
                    money1: '',
                    equipment: '',
                    mark: '',
                },
                apply_detail: null,
                applyList: {
                    tableTitle: ['幼儿园名称', '合同编号', '使用设备', '开园费用','申请日期', '申请状态', '隐藏', '操作'],
                    tableItem: []
                }
            };
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/applyList.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !==1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.applyList.tableItem = self.responseData.map(function (item,index) {
                            return {
                                gartenName: item.gartenName,
                                contractNumber: item.contractNumber,
                                equipment: item.equipment,
                                money1: item.money1,
                                registTime: self.$formatDate(item.registTime),
                                get applyState(){
                                    switch(item.state){
                                        case 0:
                                            return '待审核';
                                        case 1:
                                            return '已通过';
                                        case 2:
                                            return '已拒绝';
                                    }
                                },
                                operation : {
                                    get action(){
                                        switch(item.state){
                                            case 1:
                                                return ['查看']
                                            default:
                                                return ['查看','取消申请']
                                        }
                                    }
                                }
                            }
                        });
                    },
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            showTab: function (e) {
                var target = e.target.innerHTML;
                if(target !== '开园申请列表' && target !== '开园申请' ) return;
                this.show_current = target;
            },
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value) {
                var self = this;
                this.apply_detail = this.responseData[index];
                switch(value){
                    case '查看':
                        address3.current_province = this.apply_detail.province;
                        address3.current_city = this.apply_detail.city;
                        address3.current_counties = this.apply_detail.countries;
                        this.show_detail = true;
                        break;
                    case '取消申请':
                        confirm('是否取消申请') &&
                        $.ajax({
                            url: baseUrl + '/cancelApply.do',
                            data:{
                                resource: 1,
                                auditId: this.apply_detail.auditId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                $.ajax(self.xhr);
                                alert('取消成功');
                            }
                        });
                }
            },
            getGartenType: function (props,key) {
                this[key].gartenType = props[0];
            },
            addApply: function () {
                var self = this;
                this.applyData.province = address3.province;
                this.applyData.city = address3.city;
                this.applyData.countries = address3.counties;
                if(this.$isNotFilled(this.applyData,['province','city','countries'])) return;
                if(!this.applyData.money1){
                    this.applyData.money1 = 0;
                }
                $.ajax({
                    url: baseUrl + '/applyGarten.do',
                    data: self.applyData,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('开园申请失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                alert('开园申请成功');
                                self.show_current = '开园申请列表';
                                break;
                            case 2:
                                alert('幼儿园手机号码已被注册');
                                break;
                        }
                    }
                });
            }
        },
        beforeMount: function () {
            this.show_current = '开园申请列表';
            $.ajax(this.xhr);
        }
    });
    // 访园跟进
    var kindergartenFollow = Vue.component('kindergarten-follow',{
        template:
            '<div class="kindergartenFollow">' +
                '<div class="nav" @click="showTab($event)">'+
                    '<div :class="{current:show_current === '+"'访园跟进'"+'}">访园跟进</div>'+
                    '<div :class="{current:show_current === '+"'访园跟进历史'"+'}">访园跟进历史</div>'+
                '</div>'+
                '<div class="pushInfo" v-show="show_current==='+"'访园跟进'"+'">' +
                    '<div class="filter">' +
                        '<public-kindergartens></public-kindergartens>'+
                    '</div>'+
                    '<div class="pushInfo-info">' +
                        '<div><span>主题</span><input v-model="visitData.title" type="text" class="pushInfo-info-title" placeholder="标题"></div>'+
                        '<div class="pushInfo-info-main"><span>正文</span><textarea v-model="visitData.content" placeholder="访园跟进信息"></textarea></div>'+
                        '<input class="btn" @click="addVisit" type="button" value="添加访园跟进">'+
                    '</div>'+
                '</div>'+
                '<div class="history" v-show="show_current==='+"'访园跟进历史'"+'">' +
                    '<div class="filter">' +
                        '<public-kindergartens></public-kindergartens>'+
                    '</div>'+
                    '<public-table v-on:giveOperation="getOperation" :title="history.tableTitle" :item="history.tableItem" :itemCount="16-history.tableItem.length"></public-table>' +
                    '<public-paging :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>'+
                '</div>'+
            '</div>',
        data:function () {
            return {
                pageCount:1,
                pageNo:1 ,
                show_current: '访园跟进历史',
                responseData: [],
                visitDetail: null,
                visitData: {
                    token: token,
                    gartenId: kindergartens.id,
                    title: '',
                    content: '',
                },
                history: {
                    tableTitle: ['幼儿园名称', '跟进时间', '跟进标题', '跟进信息','隐藏','操作'],
                    tableItem: [
                        {
                            name: '向日葵幼稚园',
                            time: '2017/08/01',
                            title: '提出合作',
                            info: '对方暂时观望',
                            operation: {
                                action: ['删除']
                            }
                        }
                    ]
                }
            };
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/agentVisitList.do',
                    data:{
                        token: token,
                        gartenId: kindergartens.id,
                        pageNo: self.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        var tableItem = [];
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.responseData.forEach(function (item,index) {
                            var visitInfo = {};
                            visitInfo.name = item.gartenName;
                            visitInfo.time = self.$formatDate(item.time);
                            visitInfo.title = item.title;
                            visitInfo.info = item.content;
                            visitInfo.operation = {
                                action: ['删除']
                            };
                            tableItem[index] = visitInfo;
                        });
                        self.history.tableItem = tableItem;
                    }
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getPageNo: Vue.prototype.$getPageNo,
            showTab: function (e) {
                var target = e.target.innerHTML;
                if(target !== '访园跟进' && target !== '访园跟进历史' ) return;
                this.show_current = target;
            },
            addVisit: function () {
                var self = this;
                if(!kindergartens.id){
                    alert('未选择幼儿园');
                    return;
                }
                this.visitData.gartenId = kindergartens.id;
                $.ajax({
                    url: baseUrl + '/addVisit.do',
                    data: self.visitData,
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        $.ajax(self.xhr);
                        alert('添加成功');
                    }
                })
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.visitDetail = this.responseData[index];
                switch(value){
                    case '删除':
                        $.ajax({
                            url: baseUrl + '/deleteVisit.do',
                            data: {
                                token: token,
                                visitId: self.visitDetail.visitId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                $.ajax(self.xhr);
                                alert('删除成功');
                            }
                        })
                        break;
                }
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 设备申请
    var equipApply = Vue.component('equip-apply',{
        template:
        '<div class="equipApply">' +
            '<div @click="showTab($event)" class="nav">' +
                '<div :class="{current: show_current == '+"'设备申请'"+'}">设备申请</div>'+
                '<div :class="{current: show_current == '+"'申请列表'"+'}">申请列表</div>'+
                '<div :class="{current: show_current == '+"'购物车'"+'}">购物车</div>'+
            '</div>'+
            '<div v-show="show_current == '+"'设备申请'"+'">' +
                '<div @click="show_current = '+"'购物车'"+'" class="cart">去购物车结算</div>'+
                '<public-table @giveOperation="getOperation" :title="equipList.tableTitle" :item="equipList.tableItem" :itemCount="16-equipList.tableItem.length"></public-table>'+
                '<public-paging @givePageNo="getPageNo" :pageCount="equipList.pageCount"></public-paging>'+
                '<div v-if="show_detail" class="look-Detaildata">' +
                    '<h3>查看设备</h3>'+
                    '<div>设备名称: <input disabled v-model="equipList.detail_data.equipmentName" type="text"></div>'+
                    '<div>设备价格: <input disabled v-model="equipList.detail_data.price" type="text"></div>'+
                    '<div>备注: <textarea disabled :value="equipList.detail_data.remark"></textarea></div>'+
                    '<div v-if="equipList.detail_data.imgUrl">设备图片:<img style="display:block" v-show="equipList.detail_data.imgUrl " :src="equipList.detail_data.imgUrl" alt=""></div>'+
                    '<div class="postData">' +
                    '<input @click="show_detail = null" class="clear" type="button" value="取消">' +
                    '</div>'+
                '</div>'+
            '</div>'+
            '<div v-show="show_current == '+"'购物车'"+'">' +
                '<table>' +
                    '<thead>' +
                        '<tr>' +
                            '<th v-for="th in cartList.tableTitle">{{th}}</th>'+
                        '</tr>'+
                    '</thead>'+
                    '<tbody>' +
                        '<tr v-for="(item,index) in cartList.tableItem">' +
                            '<td>{{item.equipmentName}}</td>'+
                            '<td>{{item.unitPrice}}</td>'+
                            '<td><img @click="setCount('+"'subtract',index"+')" src="images/delete.png" alt=""><em>{{cartList.tableItem[index].count}}</em><img @click="setCount('+"'add',index"+')" src="images/add.png" alt=""></td>'+
                            '<td>{{cartList.tableItem[index].price}}</td>'+
                        '</tr>'+
                    '</tbody>'+
                '</table>'+
                '<div class="account">' +
                    '<div class="totalPrice">总价: <span v-text="cartList.totalPrice"></span></div>'+
                    '<div class="buy" @click="cartList.show_orderInfo = true">去结算</div>'+
                '</div>'+
                '<div v-if="cartList.show_orderInfo" class="cart-order add-Newdata">' +
                    '<div>邮政编码: <input v-model="cartList.orderInfo.postalcode" type="text"></div>'+
                    '<div>详细地址: <input v-model="cartList.orderInfo.address" type="text"></div>'+
                    '<div>手机号: <input v-model="cartList.orderInfo.fromPhoneNumber" type="text"></div>'+
                    '<div>总价: <input disabled :value="cartList.totalPrice" type="text"></div>'+
                    '<div class="postData">' +
                    '<input @click="orderPay" type="button" class="save" value="申请设备(申请成功后从授信额度中扣除)">' +
                    '<input @click="cartList.show_orderInfo = false" type="button" class="clear" value="取消">' +
                    '</div>'+
                '</div>'+
            '</div>'+
            '<div class="applyList" v-show="show_current == '+"'申请列表'"+'">' +
                '<div class="filter">' +
                    '发送状态: '+
                    '<select v-model="applyList.state">' +
                        '<option :value="null">请选择</option>'+
                        '<option :value="1">待处理</option>'+
                        '<option :value="2">已发送</option>'+
                        '<option :value="3">拒发送</option>'+
                    '</select>'+
                '</div>'+
                '<public-table @giveOperation="getOperation_applyList" :title="applyList.tableTitle" :item="applyList.tableItem" :itemCount="16 - applyList.tableItem.length"></public-table>'+
                '<public-paging @givePageNo="getPageNo_applyList" :pageCount="applyList.pageCount"></public-paging>'+
                '<div v-if="applyList.show_detail" class="look-Detaildata">' +
                    '<div>邮政编码: <input disabled :value="applyList.detail_data.postalcode" type="text"></div>'+
                    '<div>详细地址: <input disabled :value="applyList.detail_data.address" type="text"></div>'+
                    '<div>手机号: <input disabled :value="applyList.detail_data.fromPhonenumber" type="text"></div>'+
                    '<div>总价: <input disabled :value="applyList.detail_data.totalPrice" type="text"></div>'+
                    '<h3>申请设备信息:</h3>'+
                    '<public-table :title="applyList.tableTitle_order" :item="applyList.tableItem_order"></public-table>'+
                    '<div class="postData">' +
                        '<input @click="applyList.show_detail=false" class="clear" type="button" value="关闭">'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '设备申请',
                show_detail: false,
                equipList: {
                    pageCount: 1,
                    pageNo: 1,
                    responseData: [],
                    detail_data: null,
                    tableTitle: ['设备名称', '设备价格','隐藏','操作'],
                    tableItem: [],
                },
                applyList: {
                    pageCount: 1,
                    pageNo: 1,
                    state: null,
                    responseData: [],
                    detail_data: null,
                    show_detail: false,
                    tableTitle: ['设备名称', '设备总价','申请时间','申请状态','隐藏','操作'],
                    tableItem: [],
                    tableTitle_order:['设备名称','设备单价','申请数量','设备总价'],
                    tableItem_order:[],
                },
                cartList: {
                    tableTitle: ['设备名称','设备单价','申请数量','设备总价'],
                    tableItem: [],
                    totalPrice: 0,
                    show_orderInfo: false,
                    orderInfo: {
                        token: '',
                        postalcode: '',
                        equipmentAll: '',
                        address: '',
                        fromPhoneNumber: '',
                        totalPrice: '',
                    },
                },
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: url + '/bigcontrol/findEquipmentName.do',
                    data: {
                        pageNo: this.equipList.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.equipList.pageCount = data.info.pageCount;
                            self.equipList.responseData = data.info.list;
                            self.equipList.tableItem = self.equipList.responseData.map(function ( item, index ) {
                                return {
                                    equipmentName: item.equipmentName,
                                    price: item.price,
                                    operation: {
                                        action: ['查看','添加至购物车']
                                    }
                                }
                            });
                        }
                    }
                }
            },
            xhr_applyList: function () {
                var self = this;
               return {
                   url: baseUrl + '/findWuliaoOrder.do',
                   data: {
                       token: token,
                       pageNo: this.applyList.pageNo,
                       state: this.applyList.state
                   },
                   type: 'post',
                   success: function (data) {
                       if(data.state){
                           self.applyList.pageCount = data.info.pageCount;
                           data.info.list.forEach(function (item,index,arr) {
                               arr[index].equipmentAll = JSON.parse(item.equipmentAll);
                           });
                           self.applyList.responseData = data.info.list;
                           self.applyList.tableItem = self.applyList.responseData.map(function (item,index) {
                               return {
                                   equipmentName: item.equipmentAll.map(function (item,index) {
                                       return item.equipmentName
                                   }).join(','),
                                   totalPrice: item.totalPrice,
                                   registTime: self.$formatDate(item.registTime),
                                   get state(){
                                       switch(item.state){
                                           case 1:
                                               return '待处理';
                                           case 2:
                                               return '已发送';
                                           case 3:
                                               return '拒发送';
                                       }
                                   },
                                   operation: {
                                       action: ['查看','删除']
                                   }
                               }
                           });
                       }
                   }
               }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            },
            xhr_applyList: function () {
                $.ajax(this.xhr_applyList);
            },
            'cartList.tableItem': function () {
                this.updatePrice();
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(!/^(设备申请|申请列表|购物车)$/.test(target)) return;
                this.show_current = target;
            },
            getPageNo: function (pageNo) {
                this.equipList.pageNo = pageNo;
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.equipList.detail_data = JSON.parse(JSON.stringify(this.equipList.responseData[index]));
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                    case '添加至购物车':
                        var equip = this.equipList.detail_data;
                        var equipment = {
                            equipmentName: equip.equipmentName,
                            unitPrice: equip.price, //单价
                            count: 1,
                            get price() {
                                return this.unitPrice * this.count;
                            },  //总价
                        }
                        var tableItem = this.cartList.tableItem;
                        tableItem.splice(tableItem.length,0,equipment);
                        this.equipList.tableItem[index].operation.action = ['已添加至购物车'];
                        break;
                }

            },
            updatePrice: function () {
                var sum = 0;
                this.cartList.tableItem.forEach(function (item,index) {
                    sum += item.price;
                });
                this.cartList.totalPrice = sum;
            },
            setCount: function (type,index) {
                var equip = this.cartList.tableItem[index];
                switch(type){
                    case 'subtract':
                        equip.count--;
                        equip.count = equip.count < 0? 0 : equip.count;
                        break;
                    case 'add':
                        equip.count++;
                        break;
                }
                this.updatePrice();
            },
            orderPay: function () {
                var self = this;
                var order =  this.cartList.orderInfo;
                order.token = token;
                var equipmentAll = this.cartList.tableItem.filter(function (item,index) {
                    return item.count != 0;
                });
                order.equipmentAll = JSON.stringify(equipmentAll);
                order.totalPrice = this.cartList.totalPrice;
                confirm('是否确认申请') &&
                    $.ajax({
                        url: baseUrl + '/addWuliaoOrder.do',
                        data: order,
                        type: 'post',
                        success: function (data) {
                            if(data.state){
                                alert('申请成功,请等待后台审核');
                                self.cartList.show_orderInfo = false;
                                self.show_current = '申请列表';
                                $.ajax(self.xhr_applyList);
                            }
                        },error: function () {
                            alert('申请失败');
                        }
                    });
            },
            getPageNo_applyList: function (pageNo) {
                this.getPageNo_applyList.pageNo = pageNo;
            },
            getOperation_applyList: function (index,value,type) {
                var self = this,
                    applyList = this.applyList,
                    detail_data = applyList.detail_data,
                    responseData = applyList.responseData;
                applyList.detail_data = responseData[index];
                var detail_data = applyList.detail_data;
                switch(value){
                    case '查看':
                        applyList.show_detail = true;
                        var tableItem = [];
                        detail_data.equipmentAll.forEach(function (item,index) {
                            var order = {
                                equipmentName: item.equipmentName,
                                unitiPrice: item.unitPrice,
                                count: item.count,
                                price: item.price
                            }
                            tableItem[index] = order;
                        });
                        applyList.tableItem_order = tableItem;
                        break;
                    case '删除':
                        confirm('是否确认删除') &&
                            $.ajax({
                                url: baseUrl + '/deleteWuliaoOrder.do',
                                data: {
                                    token: token,
                                    wuliaoId: detail_data.wuliaoId
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        alert('删除成功');
                                        $.ajax(self.xhr_applyList);
                                    }
                                }
                            });
                        break;
                }
            }
        },
        created: function () {
            $.ajax(this.xhr);
            $.ajax(this.xhr_applyList);
        }
    });
    // 售后申请
    var afterApply = Vue.component('after-apply',{
        template:
            '<div class="afterApply">' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'申请列表'"+'}">申请列表</div>'+
                    '<div :class="{current: show_current == '+"'售后申请'"+'}">售后申请</div>'+
                '</div>'+

                '<div v-show="show_current == '+"'申请列表'"+'">' +
                    '<div class="filter">' +
                        '开始日期: <public-date @giveTimes="getStartTime"></public-date>'+
                        '结束日期: <public-date @giveTimes="getEndTime"></public-date>'+
                        '<select v-model="state">' +
                            '<option :value="null">回复状态</option>'+
                            '<option :value="0">未回复</option>'+
                            '<option :value="1">已回复</option>'+
                        '</select>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
                    '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '</div>'+
                '<div class="add-Newdata" v-show="show_current == '+"'售后申请'"+'">' +
                    '<h3>售后申请: </h3>'+
                    '<div>幼儿园: <public-kindergartens></public-kindergartens></div>'+
                    '<div>标题: <input v-model="applyData.title" type="text"></div>'+
                    '<div>内容: <textarea v-model="applyData.content"></textarea></div>'+
                    '<div>备注: <input v-model="applyData.mark" type="text"></div>'+
                    '<div class="postData" >' +
                        '<input type="button" @click="addApply" class="save" value="提交">'+
                    '</div>'+
                '</div>'+
                '<div class="look-Detaildata" v-if="show_detail">' +
                    '<h3>申请信息: </h3>'+
                    '<div>幼儿园: <input disabled :value="detail_data.garten? detail_data.garten.gartenName: null" type="text"></div>'+
                    '<div>标题: <input disabled :value="detail_data.title" type="text"></div>'+
                    '<div>内容: <textarea disabled :value="detail_data.content"></textarea></div>'+
                    '<div>备注: <input disabled :value="detail_data.mark" type="text"></div>'+
                    '<div>申请日期: <input disabled :value="$formatDate(detail_data.saleServiceId/1000)" type="text"></div>'+
                    '<div>回复状态: <input disabled :value="detail_data.state == 0? '+"'未回复':'已回复'"+'" type="text"></div>'+
                    '<div v-if="detail_data.state">回复日期: <input disabled :value="$formatDate(detail_data.replyTime/1000)" type="text"></div>'+
                    '<div v-if="detail_data.state">回复内容: <textarea disabled :value="detail_data.reply"></textarea></div>'+
                    '<div class="postData">' +
                        '<input type="button" @click="show_detail = false" class="clear" value="关闭">'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                show_current: '申请列表',
                startTime: 0,
                endTime: 0,
                state: null,
                applyData: {
                    token: token,
                    title: '',
                    gartenId: null,
                    content: '',
                    mark: '',
                },
                pageNo: 1,
                pageCount: 1,
                responseData: [],
                detail_data: null,
                show_detail: false,
                tableTitle: ['幼儿园','标题','内容','申请日期','回复状态','隐藏','操作'],
                tableItem: [],
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findSaleService.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        start: this.startTime,
                        end: this.endTime,
                        state: this.state,
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            var tableItem = [];
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.responseData.forEach(function (item,index) {
                                 var afterApply = {
                                     get gartenName(){
                                         if(item.garten){
                                             return item.garten.gartenName;
                                         }else {
                                             return '';
                                         }
                                     },
                                     title: item.title,
                                     content: item.content,
                                     applyTime: self.$formatDate(item.saleServiceId/1000) ,
                                     state: item.state == 0 ? '未回复' : '已回复',
                                     operation: {
                                         action: ['查看','删除']
                                     }
                                 }
                                 tableItem[index] = afterApply;
                            });
                            self.tableItem = tableItem;
                        }
                    }
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }  
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(!/^(申请列表|售后申请)$/.test(target)) return;
                this.show_current = target;
            },
            getPageNo: Vue.prototype.$getPageNo,
            getStartTime: function (timestamp) {
                this.startTime = timestamp;
            },
            getEndTime: function (timestamp) {
                this.endTime = timestamp;
            },
            addApply: function () {
                var self = this;
                this.applyData.gartenId = kindergartens.id;
                $.ajax({
                    url: baseUrl + '/addSaleService.do',
                    data: this.applyData,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('申请售后成功');
                            self.show_current = '申请列表';
                        }
                    },error: function () {
                        alert('申请失败');
                    }
                });
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                    case '删除':
                        confirm('是否确认删除') &&
                            $.ajax({
                                url: baseUrl + '/deleteSaleService.do',
                                data: {
                                    token: token,
                                    saleServiceId: this.detail_data.saleServiceId
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                    }
                                },
                                error: function () {
                                    alert('删除失败');
                                }
                            });
                }
            }
        }
    });
    // 通知记录
    var infoRecord = Vue.component('info-record',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'通知记录'"+'}">通知记录</div>'+
                '</div>'+
                '<div>' +
                    '<div class="filter">' +
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                        '是否已读: ' +
                        '<select v-model="state">' +
                            '<option :value="null">未选择</option>'+
                            '<option :value="0">未读</option>'+
                            '<option :value="1">已读</option>'+
                        '</select>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                    '<div v-if="show_detail" class="look-Detaildata">' +
                        '<h3>消息详情</h3>'+
                        '<div><textarea disabled :value="detail_data.message"></textarea></div>'+
                        '<div class="postData"><input type="button"  @click="show_detail=false" class="clear" value="关闭"></div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                startTime: 0,
                endTime: 0,
                state: null,
                show_current: '通知记录',
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['通知发送人','通知发送时间','标题','内容','状态','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                show_detail: false
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findAgentMessage.do',
                    data: {
                        token: token,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        state: this.state,
                        pageNo: this.pageNo,
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    name: item.employee.name,
                                    registTime: self.$formatDate(item.registTime),
                                    title: item.title,
                                    message: item.message,
                                    get  isread(){
                                        switch(item. isread){
                                            case 0:
                                                return '未读';
                                            case 1:
                                                return '已读';
                                        }
                                    },
                                    operation: {
                                        action: ['查看']
                                    }
                                }
                            });
                        }
                    }
                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(通知记录)$/.test(target)){
                    this.show_current = target;
                }
            },
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        this.detail_data.isread == 0 &&
                        //点查看的时候表示这条信息已读
                        $.ajax({
                            url: baseUrl + '/readAgentMessage.do',
                            data: {
                                agentMessageId: this.detail_data.agentMessageId
                            },
                            type: 'post',
                        });
                        break;
                }
            }
        }
    });


    // template:
    //     '<div>' +
    //         '<div @click="showTab($event)" class="nav">' +
    //             '<div :class="{current: show_current == '+"'员工列表'"+'}">员工列表</div>'+
    //             '<div :class="{current: show_current == '+"'员工添加'"+'}">员工添加</div>'+
    //         '</div>'+
    //         '<div v-show="show_current=='+"''"+'">' +
    //             '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
    //             '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
    //         '</div>'+
    //     '</div>',
    // data: function () {
    //     return {
    //         show_current: '员工列表',
    //         pageNo: 1,
    //         pageCount: 1,
    //         tableTitle: ['隐藏','操作'],
    //         tableItem: [],
    //         responseData: [],
    //         detail_data: null,
    //     }
    // },
    // computed: {
    //     xhr: function () {
    //         var self = this;
    //         return {
    //
    //         }
    //     }
    // },
    // methods: {
    //     showTab: function (e) {
    //         var target = e.target.innerText;
    //         if(/^(员工列表|员工添加)$/.test(target)){
    //             this.show_current = target;
    //         }
    //     },
    //     getPageNo: Vue.prototype.$getPageNo,
    //     getOperation: function (index,value,type) {
    //     }
    // }


    var routes = [
        // 信息管理
        {path:'/infoManage',component: infoManage},
        // 信用额度管理
        {path: '/buyCreditMoney', component: buyCreditMoney},
        // 提现管理
        {path: '/applyMoney',component: applyMoney},
        // 代理商列表
        {path: '/agentList',component: agentList},
        // 幼儿园管理
        {path: '/kindergartenManage',component: kindergartenManage},
        // 开园申请
        {path: '/kindergartenApply',component: kindergartenApply},
        // 访园跟进
        {path: '/kindergartenFollow',component: kindergartenFollow},
        // 子代理业绩统计
        {path: '/performanceStatistics',component: performanceStatistics},
        // 设备申请
        {path: '/equipApply', component: equipApply},
        // 售后申请
        {path: '/afterApply', component: afterApply},
        // 通知记录
        {path: '/infoRecord', component: infoRecord}
    ];
    var router = new VueRouter({
        routes: routes
    });

    var loader = new Vue({
        el: '#loader',
        data: {
            show: false
        }
    });
    var header = new Vue({
        el: '#header',
        data: {
            agentName: info.agentName + '管理后台',
            name: info.name
        },
        methods: {
            logout: function () {
                location.href = url + '/login.html';
            }
        }
    });
    var main = new Vue({
        router: router,
        el: '#main',
        data: {
            info: info
        }
    });


})(window, document);
