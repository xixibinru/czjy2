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
    if(sessionStorage.info){
        var info = JSON.parse(sessionStorage.info),
            token = info.token;
    }
    var url = Vue.prototype.$getOrigin();
    var baseUrl = url + '/bigcontrol';
    var date = (new Date().getTime())/1000;
    //全局省市区
    var address3 = {
            data: $.ajax({
                url: '../data/address3.json',
                success: function(data){
                    return data;
                },
                async: false
            }).responseJSON,
            current_province: '省份',
            current_city: '城市', //用于判断是否显示数据（空为不显示）和显示当前数据
            current_counties: '县区',
            province: null,
            city: null,
            counties: null,
            grade: '未选择'
        },
        //全局幼儿园选择
        kindergartens = {
            data: [],
            ids: [],
            name: '幼儿园',
            id: null
        },
        agents = {
            data:[],
            ids: [],
            name: '代理商',
            id: null
        };

    // 得到子组件当前的年级和班级
    Vue.prototype.$getGradeAndClass = function ($event) {
        this.gradeId = $event[0];
        this.classId = $event[1];
        this.babyId = $event[2];
        this.index = $event[3];
    }
    // 得到部门编号
    Vue.prototype.$getDepartmentNo = function ($event) {
        this.departmentNo = $event[0];
    }
    // 得到职位编号
    Vue.prototype.$getJobNo = function ($event) {
        this.jobsNo = $event[0];
    }
    // 筛选员工时 得到 部门、职位、员工编号
    Vue.prototype.$getDje = function (arr) {
        this.departmentNo = arr[0];
        this.jobsNo = arr[1];
        this.employeeNo = arr[2];
    }
    // 得到幼儿园类型
    Vue.prototype.$getGartenType = function (arr,prop) {
        if(prop){
            this[prop].gartenType = arr[0];
        }else {
            this.gartenType = arr[0];
        }

    }
    //判断是否已开通考勤和视频 传入一个数组 数组里是日期格式 转成时间戳 排序  如果截止日期大于当前日期，则显示已开通
    Vue.prototype.$isDredge = function (arr,isDetail) {
        var now = new Date().getTime()/1000,
            timestamp_arr = [];
        for(var i = 0; i < arr.length; i++){
            timestamp_arr[i] = new Date(arr[i]).getTime()/1000;
        }
        var max = timestamp_arr.sort(function (a,b) {
            return b-a;
        })[0];
        if(isDetail){
            return Vue.prototype.$expirationDate(max);
        }else{
            return now > max ? '未开通' : '已开通';
        }
    }
    //传入一个时间戳 判断是否开通考勤、视频 已开通显示到期时间 未开通显示未开通
    Vue.prototype.$expirationDate = function (timestamp) {
        var now = new Date().getTime()/1000;
        var isTimestamp = /^\d*$/; //判断传入的是时间戳还是日期格式
        if(!isTimestamp.test(timestamp)){
            timestamp = new Date(timestamp).getTime()/1000;
        }
        if(now > timestamp){
            return '未开通';
        }else {
            return Vue.prototype.$formatDate(timestamp);
        }
    }

    //三级联动组件 加载时即获取数据  想用父元素访问子组件需要给组件上添加ref="xxx" 父组件.$refs.xxx.（data里的属性） 即可访问数据
    Vue.component('public-address3',{
        props:['_province','_city','_counties','disable'],
        template: '<div class="address3" @change="select_defaultValue($event)">' +
        '<select :disabled="disable"  name="province" v-model="current_province">' +
            '<option v-for="(value,province,index) in data" :key="index" >{{province}}</option>' +
        '</select>' +
        '<select :disabled="disable" v-show="current_province !== '+"'省份'"+'" name="city" v-model="current_city">' +
            '<option>城市</option>' +
            '<option v-for="(value,city) in data[current_province]">{{city}}</option>'+
        '</select>' +
        '<select :disabled="disable"  name="counties" v-model="current_counties" v-show="current_city !== '+"'城市'"+'">' +
            '<option>县区</option>' +
            '<option v-for="counties in data[current_province][current_city]">{{counties}}</option>'+
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
                this.city = this.current_city === '城市'? null:this.current_city;
            },
            current_counties: function () {
                this.counties = this.current_counties === '县区'? null:this.current_counties;
            },
            current_grade: function () {
                this.grade = this.current_grade;
            }
        },
        created: function () {
            if(this._province || this._province != undefined){
                this.current_province = this._province? this._province : '省份';
            }
            if(this._city || this._city != undefined){
                this.current_city = this._city? this._city : '城市';
            }
            if(this._counties || this._counties != undefined){
                this.current_counties = this._counties? this._counties : '县区';
            }
        }
    });

    // 幼儿园组件
    Vue.component('public-kindergartens',{
        template:
        '<div class="inlineBlock">'+
            '<select v-model="id">' +
                '<option :value="null">幼儿园</option>' +
                '<option v-for="kindergarten in data" :value="kindergarten.id">{{kindergarten.name}}</option>' +
            '</select>'+
        '</div>',
        data: function () {
            return kindergartens;
        },
        computed: {
            xhr: function () {
                return {
                    url: baseUrl + '/getGarten.do',
                    data: {
                        token: token,
                        province: address3.province,
                        city: address3.city,
                        countries: address3.counties
                    },
                    type: 'post',
                    success: function(data){
                        var arr = [], //服务器返回所有幼儿园数据  arr只存放幼儿园名字和ID
                            ids = []; //用于存放所有幼儿园的id
                        data.info.forEach(function(value,index){
                            var o = {
                                name:value.gartenName,
                                id: value.gartenId
                            };
                            arr[index] = o;
                            ids[index] = value.gartenId;
                        });
                        kindergartens.data = arr;
                        kindergartens.ids = ids;
                    }
                }
            }
        },
        watch:{
            xhr:function () {
                this.name = '幼儿园';
                this.id = null;
                $.ajax(this.xhr);
            },
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    ///幼儿园年级班级宝宝组件
    Vue.component('public-gradeAndClass',{
        //hideClass = true  _gradeId 设置默认选择的年级  _classId 设置默认选择的班级 隐藏班级下拉框 showBaby = true 显示宝宝下拉框
        props: ['_gradeId','_classId','_babyId','index','hideClass','showBaby'],
        template:
            '<div class="inlineBlock">' +
                '<select v-model="gradeId">' +
                    '<option :value="null">年级</option>'+
                    '<option v-for="item in gradeList" :value="item.id">{{item.name}}</option>'+
                '</select>'+
                '<select v-show="!hideClass" v-model="classId">' +
                    '<option :value="null">班级</option>'+
                    '<option v-for="item in classList" :value="item.id">{{item.name}}</option>'+
                '</select>'+
                '<select v-if="showBaby" v-model="babyId">' +
                    '<option :value="null">宝宝</option>'+
                    '<option v-for="item in babyList" :value="item.id">{{item.name}}</option>'+
                '</select>'+
            '</div>',
        data: function () {
            return {
                gradeList: [],
                classList: [],
                babyList: [],
                gradeId: null,
                classId: null,
                babyId: null,
                gradeName: null,
                className: null,
            }
        },
        computed: {
            gartenId: function () {
                return kindergartens.id;
            },
            xhr_grade: function () {
                var self = this;
                return {
                    url: url + '/smallcontrol/findGartenGrade.do',
                    data: {
                        gartenId: this.gartenId,
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.gradeList = data.info.map(function (item) {
                                return {
                                    id: item.gradeId,
                                    name: item.leadGrade
                                }
                            });
                            if(self.gradeId){
                                var flag = self.gradeList.some(function (item) {
                                    return item.id == self.gradeId;
                                });
                                if(!flag){
                                    self.gradeId = null;
                                }
                            }
                        }
                    }
                }
            },
            xhr_class: function () {
                var self = this;
                return {
                    url: url + '/smallcontrol/findGartenClass.do',
                    data: {
                        gartenId: this.gartenId,
                        gradeId: this.gradeId
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.classList = data.info.map(function (item) {
                                return {
                                    id: item.classId,
                                    name: item.leadClass
                                }
                            });
                            if(self.classId){
                                var flag = self.classList.some(function (item) {
                                    return item.id == self.classId;
                                });
                                if(!flag){
                                    self.classId = null;
                                }
                            }
                        }
                    }
                }
            },
            xhr_baby: function () {
                var self = this;
                return {
                    url: baseUrl + '/getStudentList.do',
                    data: {
                        token: token,
                        classId: self.classId
                    },
                    type: 'post',
                    success: function (data) {
                        if(!data.state) return;
                        self.babyList = data.info.map(function (item) {
                            return {
                                id: item.babyId,
                                name: item.babyName
                            }
                        });
                    }
                }
            }
        },
        watch: {
            gartenId: function () {
                $.ajax(this.xhr_grade);
            },
            gradeId: function () {
                $.ajax(this.xhr_class);
                this.giveGradeAndClass();
            },
            classId: function () {
                this.giveGradeAndClass();
                if(!this.showBaby) return;
                $.ajax(this.xhr_baby);
            },
            babyId: function () {
                this.giveGradeAndClass();
            }
        },
        methods: {
            giveGradeAndClass: function () {
                this.$emit('giveGradeAndClass',[this.gradeId,this.classId,this.babyId,this.index]);
            }
        },
        created: function () {
            $.ajax(this.xhr_grade);
            if(this._gradeId){
                this.gradeId = this._gradeId;
            }
            if(this._classId){
                this.classId = this._classId;
            }
            if(this._babyId){
                this.babyId = this._babyId;
            }
            if(this.showBaby){
                $.ajax(this.xhr_baby);
            }
        }
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
                url: baseUrl + '/findGartentype.do',
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
    //代理商组件
    Vue.component('public-agents',{
        props: ['_agentId'],
        template:
            '<select v-model="id">' +
                '<option :value="null">代理商</option>' +
                '<option v-for="agent in data" :key="agent.id" :value="agent.id">{{agent.name}}</option>' +
            '</select>',
        data:function () {
            return agents;
        },
        computed:{
            xhr:function () {
                var self = this;
                return {
                    url: baseUrl + '/getAgentName.do',
                    data:{
                        token:token,
                        province: address3.province,
                        city: address3.city,
                        countries: address3.countries,
                    },
                    type: 'post',
                    success:function (data) {
                        var arr = [],//用于存放代理商名字和id
                            ids = [];
                        data.info.forEach(function(item,index){
                            var agent = {
                                name: item.agentName,
                                id: item.agentId
                            };
                            arr[index] = agent;
                            ids[index] = item.agentId;
                        });
                        agents.data = arr;
                        agents.ids = ids;
                    }
                }
            }
        },
        watch:{
            xhr:function () {
                $.ajax(this.xhr);
            }
        },
        created: function () {
            $.ajax(this.xhr);
            if(this._agentId){
                this.id = this._agentId;
            }
        }
    });


    //部门列表组件
    Vue.component('public-departments',{
        props: ['id'],
        template:
        '<select @change="changeSel($event)" v-model="departmentNo">' +
            '<option :value="null">部门</option>'+
            '<option v-for="item in data" :value="item.departmentNo">{{item.departmentName}}</option>'+
        '</select>',
        data: function () {
            return {
                data: [],
                departmentNo: null,
            }
        },
        methods: {
            giveDepartmentNo: function () {
                this.$emit('giveDepartmentNo',[this.departmentNo,this.departmentName]);
            },
            changeSel: function (e) {
                var sel = e.target.selectedIndex;
                this.departmentName = e.target[sel].innerText;
                // this.giveDepartmentNo();
            },
        },
        watch: {
            departmentNo: function () {
                this.giveDepartmentNo();
            }
        },
        beforeCreate: function () {
            var self = this;
            $.ajax({
                url: baseUrl + '/findDepartment.do',
                success: function (data) {
                    var data_arr = [];
                    data.info.forEach(function (item,index) {
                        var department = {
                            departmentNo: item.departmentNo,
                            departmentName: item.departmentName
                        }
                        data_arr[index] = department;
                    });
                    self.data = data_arr;
                    self.giveDepartmentNo();
                }
            });
        },
        created: function () {
            if(this.id){
                this.departmentNo = this.id;
            }
        }
    });
    //职位列表组件
    Vue.component('public-jobs',{
        props: ['id'],
        template:
        '<select v-model="jobNo">' +
            '<option :value="null">职位</option>'+
            '<option v-for="item in data" :value="item.jobNo">{{item.jobName}}</option>'+
        '</select>',
        data: function () {
            return {
                data: [],
                jobNo: null,
            }
        },
        watch: {
            jobNo: function () {
                this.giveJobNo();
            }
        },
        methods: {
            giveJobNo: function () {
                this.$emit('giveJobNo',[this.jobNo]);
            }
        },
        beforeCreate: function () {
            var self = this;
            $.ajax({
                url: baseUrl + '/findJobs.do',
                success: function (data) {
                    if(data.state){
                        self.data = data.info.map(function (item,index) {
                            return {
                                jobNo: item.jobsNo,
                                jobName: item.jobsName
                            }
                        });
                        self.giveJobNo();
                    }
                }
            });
        },
        created: function () {
            if(this.id){
                this.jobNo = this.id;
            }
        }
    });
    //根据部门和职位筛选员工
    Vue.component('public-dje',{
        // d部门编号  j职位编号  e员工编号
        props:['d','j','e'],
        template:
            '<div class="inlineBlock">' +
                '<public-departments :id="departmentNo" @giveDepartmentNo="$getDepartmentNo($event)"></public-departments>'+
                '<public-jobs :id="jobsNo" @giveJobNo="$getJobNo($event)"></public-jobs>'+
                '<select v-model="id">' +
                    '<option :value="null">员工</option>'+
                    '<option v-for="item in data" :value="item.id">{{item.name}}</option>'+
                '</select>' +
            '</div>',
        data: function () {
            return {
                departmentNo: null,
                jobsNo: null,
                data: [],
                id: null,
            }
        },
        computed: {
            dj: function () {
                return this.departmentNo + this.jobsNo;
            },
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/getEmployee.do',
                    data: {
                        departmentNo: this.departmentNo,
                        jobsNo: this.jobsNo
                    },
                    type: 'get',
                    success: function (data) {
                        if(data.state){
                            self.data = data.info.map(function (item,index) {
                                return {
                                    id: item.employeeNo,
                                    name: item.name
                                }
                            });
                            var flag = self.data.some(function (item) {
                                return item.id === self.id;
                            });
                            if(!flag){
                                self.id = null;
                            }
                        }
                    }
                }
            }
        },
        watch: {
            //部门或者职位发生变化  重新请求员工数据并触发事件
            dj: function () {
                $.ajax(this.xhr);
            },
            //id发生变化就触发事件
            id: function () {
                this.giveDje();
            }
        },
        methods: {
            giveDje: function () {
                this.$emit('giveDje',[this.departmentNo,this.jobsNo,this.id]);
            }
        },
        created: function () {
            $.ajax(this.xhr);
            if(this.d){
                this.departmentNo = this.d;
            }
            if(this.j){
                this.jobsNo = this.j;
            }
            if(this.e){
                this.id = this.e;
            }
        }
    });
    // 分配权限
    Vue.component('public-permission',{
        props: ['pms'],
        template:
        '<div class="permission">' +
            '<h3>权限: </h3>'+
            '<div><i></i>幼儿园管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.infoStatistics" type="checkbox">统计</li>'+
                '<li><input v-model="permission.infoManage" type="checkbox">信息管理</li>'+
                '<li><input v-model="permission.kindergartenManage" type="checkbox">幼儿园管理</li>'+
                '<li><input v-model="permission.attendanceCardManage" type="checkbox">考勤卡管理</li>'+
                '<li><input v-model="permission.clearUnusual" type="checkbox">清除考勤异常</li>'+
            '</ul>'+
            '<div><i></i>审核</div>' +
            '<ul>' +
                '<li><input v-model="permission.kindergartenCheck" type="checkbox">开园审核</li>'+
            '</ul>'+
            '<div><i></i>代理商管理</div>' +
                '<ul>' +
                    '<li><input v-model="permission.agentManage" type="checkbox">代理商管理</li>'+
                    '<li><input v-model="permission.agentPerformance" type="checkbox">代理商业绩统计</li>'+
                    '<li><input v-model="permission.agentCard" type="checkbox">代理商考勤卡</li>'+
                    '<li><input v-model="permission.agentCredit" type="checkbox">代理商购买信用额度</li>'+
                    '<li><input v-model="permission.drawMoneyManage" type="checkbox">代理商提现管理</li>'+
                '</ul>'+
            '<div><i></i>费用设置</div>' +
                '<ul>' +
                    '<li><input v-model="permission.setChargePrice" type="checkbox">视频、考勤收费价格设置</li>'+
                '</ul>'+
            '<div><i></i>消息中心</div>' +
                '<ul>' +
                    '<li><input v-model="permission.pushInfo" type="checkbox">消息推送</li>'+
                '</ul>'+
            '<div><i></i>终端管理</div>' +
                '<ul>' +
                    '<li><input v-model="permission.attendanceMachine" type="checkbox">考勤机</li>'+
                    '<li><input v-model="permission.attendanceCamera" type="checkbox">考勤摄像头</li>'+
                    '<li><input v-model="permission.liveCamera" type="checkbox">直播摄像头</li>'+
                '</ul>'+
            '<div><i></i>设备管理</div>' +
                '<ul>' +
                    '<li><input v-model="permission.equipManage" type="checkbox">设备管理</li>'+
                    '<li><input v-model="permission.equipOrder" type="checkbox">设备订单处理</li>'+
                    '<li><input v-model="permission.afterSales" type="checkbox">设备售后处理</li>'+
                '</ul>'+
            '<div><i></i>运营中心</div>' +
                '<ul>' +
                    '<li><input v-model="permission.orderLook" type="checkbox">订单查看</li>'+
                    '<li><input v-model="permission.userFeedback" type="checkbox">用户反馈</li>'+
                '</ul>'+
            '<div><i></i>公司管理</div>' +
                '<ul>' +
                    '<li><input v-model="permission.staffManage" type="checkbox">员工管理</li>'+
                    '<li><input v-model="permission.departmentManage" type="checkbox">部门管理</li>'+
                    '<li><input v-model="permission.jobManage" type="checkbox">职位管理</li>'+
                    '<li><input v-model="permission.addReport" type="checkbox">添加报表</li>'+
                    '<li><input v-model="permission.totalReport" type="checkbox">全员报表</li>'+
                    '<li><input v-model="permission.departmentReport" type="checkbox">部门报表</li>'+
                    '<li><input v-model="permission.kindergartenApply" type="checkbox">开园申请</li>'+
                    '<li><input v-model="permission.equipApply" type="checkbox">设备申请</li>'+
                    '<li><input v-model="permission.departmentEquip" type="checkbox">部门设备</li>'+
                    '<li><input v-model="permission.addActivity" type="checkbox">添加活动</li>'+
                    '<li><input v-model="permission.totalActivity" type="checkbox">全部活动</li>'+
                    '<li><input v-model="permission.departmentActivity" type="checkbox">部门活动</li>'+
                    '<li><input v-model="permission.employeeCard" type="checkbox">员工考勤卡</li>'+
                    '<li><input v-model="permission.employeePerformance" type="checkbox">员工业绩统计</li>'+
                    '<li><input v-model="permission.operationLog" type="checkbox">员工操作记录</li>'+
                '</ul>'+
            '<div><i></i>基本设置</div>' +
                '<ul>' +
                    '<li><input v-model="permission.parentRelation" type="checkbox">家长与宝宝关系</li>'+
                    '<li><input v-model="permission.gartenType" type="checkbox">幼儿园类型设置</li>'+
                    // '<li><input v-model="permission.emptyData" type="checkbox">清理无效数据</li>'+
                '</ul>'+
        '</div>',
        data: function () {
            return {
                permission: {
                    infoStatistics: false,
                    infoManage: false,
                    kindergartenManage: false,
                    attendanceCardManage: false,
                    clearUnusual: false,
                    kindergartenCheck: false,
                    agentManage: false,
                    agentPerformance: false,
                    agentCard: false,
                    agentCredit: false,
                    drawMoneyManage: false,
                    setChargePrice: false,
                    pushInfo: false,
                    attendanceMachine: false,
                    attendanceCamera: false,
                    liveCamera: false,
                    equipManage: false,
                    equipOrder: false,
                    afterSales: false,
                    orderLook: false,
                    userFeedback: false,
                    staffManage: false,
                    departmentManage: false,
                    jobManage: false,
                    addReport: false,
                    totalReport: false,
                    departmentReport: false,
                    kindergartenApply: false,
                    equipApply: false,
                    departmentEquip: false,
                    addActivity: false,
                    totalActivity: false,
                    departmentActivity: false,
                    employeeCard: false,
                    employeePerformance: false,
                    operationLog: false,
                    parentRelation: false,
                    gartenType: false,
                    // emptyData: false
                }
            }
        },
        watch: {
            permission: {
                deep: true,
                handler: function () {
                    this.givePermission();
                }
            }
        },
        methods: {
            givePermission: function () {
                this.$emit('givePermission',JSON.stringify(this.permission));
            }
        },
        created: function () {
            if(this.pms){
                var pms = JSON.parse(this.pms);
                for(var k in pms){
                    this.permission[k] = pms[k];
                }
            }
        },
        mounted: function () {
            $('.permission i').on('click',function () {
                $(this).toggleClass('open').parent().next('ul').toggle();
            });
        }
    });


    /*---------------------------------------*/


    //个人信息
    var personalCenter = Vue.component('personal-center',{
        template:
        '<div v-if="detail_data" class="look-Detaildata">' +
            '<h3>个人信息</h3>'+
            '<div>部门: <public-departments disabled :id="detail_data.departmentNo" ></public-departments></div>'+
            '<div>职位: <public-jobs disabled :id="detail_data.jobsNo"></public-jobs></div>'+
            '<div>代理区域(销售人员): <public-address3 :disable="true" :_province="detail_data.province" :_city="detail_data.city" :_counties="detail_data.countries" disabled></public-address3></div>'+
            '<div>姓名: <input disabled :value="detail_data.name" type="text"></div>'+
            '<div>性别: ' +
                '<select disabled :value="detail_data.sex">' +
                    '<option :value="0">男</option>'+
                    '<option :value="1">女</option>'+
                '</select>'+
            '</div>'+
            '<div>入职时间: <input disabled :value="$formatDate(detail_data.entryTime)" type="text"></div>'+
            '<div>手机号: <input disabled :value="detail_data.phoneNumber" type="text"></div>'+
            '<div>密码: <input disabled :value="detail_data.pwd" type="text"></div>'+
        '</div>',
        data: function () {
            return {
                detail_data: null,
            }
        },
        created: function () {
            this.detail_data = info;
            // this.detail_data.province = this.detail_data.province || '省份';
            // this.detail.city = this.detail_data.city || '城市';
            // this.detail.countries = this.detail_data.countries || '县区';
        }
    });
    // 统计
    var infoStatistics = Vue.component('info-statistics', {
        template:
        '<div class="infoStatistics">' +
                '<div class="filter">'+
                    '<select  v-model="current_StatisticsType">' +
                        '<option>新增统计</option>' +
                        '<option>新增详情</option>' +
                        '<option>删除统计</option>' +
                        '<option>删除详情</option>' +
                        '<option>晨检统计</option>' +
                        '<option>考勤统计</option>' +
                    '</select>'+
                    '<div v-show="current_StatisticsType === '+"'新增详情'"+' || current_StatisticsType === '+"'删除详情'"+'" class="inlineBlock">' +
                        '<public-address3></public-address3>' +
                        '<public-kindergartens></public-kindergartens>' +
                        '<select v-model="current_personType">' +
                        '<option>全部</option>' +
                        '<option>宝宝</option>' +
                        '<option>家长</option>' +
                        '<option>教职工</option>' +
                        '</select>'+
                    '</div>'+
                    '<span v-show="current_StatisticsType!=='+"'晨检统计'"+'&&current_StatisticsType!=='+"'考勤统计'"+'">开始日期: </span>'+
                    '<public-date  @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                    '<span v-show="current_StatisticsType!=='+"'晨检统计'"+'&&current_StatisticsType!=='+"'考勤统计'"+'">结束日期: </span>'+
                    //非时间段默认使用endTime
                    '<public-date @giveTimes="$getTimes($event,'+"'endTime'"+')" v-show="current_StatisticsType!=='+"'晨检统计'"+'&&current_StatisticsType!=='+"'考勤统计'"+'" ></public-date>'+
                '</div>'+
            '<public-table :title="current_StatisticsData.tableTitle" :item="current_StatisticsData.tableItem" :itemCount="16-current_StatisticsData.tableItem.length" ></public-table>' +
            '<public-paging v-show="current_StatisticsType==='+"'新增详情'"+'||current_StatisticsType==='+"'删除详情'"+'"  :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>' +
        '</div>',
        data: function () {
            return {
                //search部分
                current_StatisticsType:'', //当前选择的统计类型  created 时变为新增数据 即直接向服务器请求数据
                startTime: 0, //统计筛选的开始时间
                endTime: 0, //统计筛选的结束时间
                current_personType: '全部',
                kindergartens: ['红太阳幼儿园', '红苹果幼儿园', '绿帽子幼儿园'],//假数据
                pageNo: 1,
                pageCount: 1, //假数据
                newStatistics:{
                    tableTitle:['宝宝','教职工','家长'],
                    tableItem:[]
                },
                newDetail:{
                    tableTitle: ['幼儿园', '幼儿园地址', '新增类型', '姓名', '新增时间'],
                    tableItem: []
                },
                deleteStatistics:{
                    tableTitle:['宝宝','教职工','家长'],
                    tableItem:[]
                },
                deleteDetail:{
                    tableTitle: ['幼儿园','幼儿园地址','删除类型','姓名', '删除时间'],
                    tableItem:[]
                },
                morningCheckStatistics:{
                    tableTitle: ['已晨检人数','缺检人数','晨检异常(≥37℃)'],
                    tableItem:[]
                },
                attendanceStatistics:{
                    tableTitle: ['上午应打卡人数','上午已打卡人数','下午应打卡人数','下午已打卡人数'],
                    tableItem: []
                }
            };
        },
        methods: {
            getPageNo: Vue.prototype.$getPageNo
        },
        computed: {
            current_StatisticsData:function () { //当前数据类型
                switch(this.current_StatisticsType){
                    case '新增统计':
                        return this.newStatistics;
                    case '新增详情':
                        return this.newDetail;
                    case '删除统计':
                        return this.deleteStatistics;
                    case '删除详情':
                        return this.deleteDetail;
                    case '晨检统计':
                        return this.morningCheckStatistics;
                    case '考勤统计':
                        return this.attendanceStatistics;
                }
            },
            xhr: function () {
                var self = this;
                switch(this.current_StatisticsType){
                    //年月日、当前页 等还没写
                    case '新增统计':
                        return {
                            url: baseUrl + '/addtongji.do',
                            data: {
                                token: token,
                                start: this.startTime,
                                end: this.endTime
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1){
                                    return;
                                }
                                var tableItem = {
                                    babyCount: data.babyCount,
                                    teacherCount: data.workerCount,
                                    parentCount: data.parentCount
                                }
                                self.newStatistics.tableItem.splice(0,1,tableItem);
                            }
                        }
                    case '新增详情':
                        return {
                            url: baseUrl + '/adddetail.do',
                            data: {
                                token: token,
                                start: this.startTime,
                                end: this.endTime,
                                province: address3.province,
                                city: address3.city,
                                countries: address3.counties,
                                job: this.current_personType === '全部'? null: this.current_personType,
                                pageNo: this.pageNo,
                                gartenId: kindergartens.id
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1){
                                    return;
                                }
                                self.pageCount = data.info.pageCount;
                                var arr = [];
                                data.info.list.forEach(function (value,index) {
                                    var o = {};
                                    arr[index] = o;
                                    o.kindergarten = value.gartenName;
                                    o.address = value.province + value.city + value.countries;
                                    o.type = value.type;
                                    o.name = value.name;
                                    o.addTime =  new Date(value.registTime*1000).toLocaleDateString();
                                });
                                self.newDetail.tableItem = arr;
                            }
                        }
                    case '删除统计':
                        return {
                            url: baseUrl + '/deletetongji.do',
                            data:{
                                token: token,
                                start: this.startTime,
                                end: this.endTime
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1){
                                    return;
                                }
                                var tableItem = {
                                    babyCount: data.babyCount,
                                    teacherCount: data.workerCount,
                                    parentCount: data.parentCount
                                }
                                self.deleteStatistics.tableItem.splice(0,1,tableItem);
                            }
                        }
                    case '删除详情' :
                        return {
                            url: baseUrl + '/deletedetail.do',
                            data: {
                                token: token,
                                start: this.startTime,
                                end: this.endTime,
                                province: address3.province,
                                city: address3.city,
                                countries: address3.counties,
                                job: this.current_personType === '全部'? null: this.current_personType,
                                pageNo: this.pageNo,
                                gartenId: kindergartens.id
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1){
                                    return;
                                }
                                self.pageCount = data.info.pageCount;
                                var arr = [];
                                data.info.list.forEach(function (value,index) {
                                    var o = {};
                                    arr[index] = o;
                                    o.kindergarten = value.gartenName;
                                    o.address = value.province + value.city + value.countries;
                                    o.type = value.type;
                                    o.name = value.name;
                                    o.deleteTime =  new Date(value.registTime*1000).toLocaleDateString();
                                });
                                self.deleteDetail.tableItem = arr;
                            }
                        }
                    case '晨检统计':
                        return {
                            url: baseUrl + '/checktongji.do',
                            data:{
                                token: token,
                                time: this.startTime,
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1){
                                    return;
                                }
                                var tableItem = {
                                    realCount: data.info.realCount,
                                    lackCount: data.info.lackCount,
                                    abnormalCount: data.info.heightCount
                                };
                                self.morningCheckStatistics.tableItem.splice(0,1,tableItem)
                            }
                        }
                    case '考勤统计':
                        return {
                            url: baseUrl + '/dakatongji.do',
                            data:{
                                token: token,
                                time: this.startTime,
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1){
                                    return;
                                }
                                var tableItem = {
                                    amShouldCheck: data.info.shouldCountAm,
                                    amCheck: data.info.realCountAm,
                                    pmShouldCheck: data.info.shouldCountPm,
                                    pmCheck: data.info.realCountPm
                                };
                                self.attendanceStatistics.tableItem.splice(0,1,tableItem);
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
        beforeMount:function () {
            this.current_StatisticsType = '新增统计';
        }
    });
    // 用户信息管理
    var infoManage = Vue.component('info-manage',{
        template:
        '<div class="infoManage">'+
            '<div class="filter">'+
                '<div>' +
                    '<select v-model="current_usersType">' +
                        '<option>家长信息管理</option>'+
                        '<option>宝宝信息管理</option>'+
                        '<option>教职工信息管理</option>'+
                        '<option>幼儿园信息管理</option>'+
                    '</select>'+
                    '<public-address3></public-address3>'+
                    '<public-kindergartens v-show="current_usersType !=='+"'幼儿园信息管理'"+'"></public-kindergartens>'+
                '</div>'+
                '<div v-if="current_usersType !=='+"'幼儿园信息管理'"+'" class="inlineBlock">姓名: <input v-model="name" class="name" type="text"></div>'+
                '<div v-else class="inlineBlock">幼儿园名: <input v-model="name" class="name" type="text"></div>'+
                '<div v-show="current_usersType !=='+"'宝宝信息管理'"+'" class="inlineBlock">' +
                    '手机号: <input v-model="phoneNumber" type="text">'+
                '</div>'+
                '<div v-show="current_usersType ==='+"'家长信息管理'"+' || current_usersType ==='+"'幼儿园信息管理'"+'" class="inlineBlock">' +
                    '视频功能: '+
                    '<select v-model="monitorState">'+
                        '<option :value="3">请选择</option>'+
                        '<option :value="1">未开通</option>'+
                        '<option :value="2">已开通</option>'+
                    '</select>'+
                    '考勤功能: '+
                    '<select v-model="attendanceState">'+
                        '<option :value="3">请选择</option>'+
                        '<option :value="1">未开通</option>'+
                        '<option :value="2">已开通</option>'+
                    '</select>'+
                '</div>' +
                '<public-gradeAndClass v-on:giveGradeAndClass="$getGradeAndClass($event)" v-show="current_usersType ==='+"'宝宝信息管理'"+'"></public-gradeAndClass>'+
                '<span v-show="current_usersType !== '+"'幼儿园信息管理'"+'" v-text="personType + '+"'总人数: ' + personCount"+'"></span>'+
                '<div v-show="current_usersType !== '+"'幼儿园信息管理'"+'" style="margin-left: 10px" class="btn-skyblue" @click="exportExcel">{{"导出"+ personType+"Excel"}}</div>'+
            '</div>'+
            '<public-table :title="current_usersData.tableTitle" :item="current_usersData.tableItem" :itemCount="16 - current_usersData.tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
            '<public-paging :pageCount="pageCount" v-on:givePageNo="$getPageNo($event)"></public-paging>' +
            //家长详细信息
            '<div class="look-Detaildata" v-if="showDetail === '+"'parent'"+'">'+
                '<h3>家长详细信息: </h3>'+
                '<div>姓名: <input type="text" :value="parent_detail.parentInfo.parentName" disabled></div>'+
                '<div>详细地址: <input type="text" :value="parent_detail.parentInfo.address" disabled></div>'+
                '<div>手机号: <input disabled type="text" :value="parent_detail.parentInfo.phoneNumber"></div>'+
                '<div>是否冻结: <input type="text" :value="null" disabled></div>'+
                '<h3>宝宝信息: </h3>'+
                '<public-table :title="parents.tableTitle_babys" :item="parents.tableItem_babys" v-on:giveOperation="getOperation"></public-table>'+
                '<div class="look"><input @click="closeDetail" class="clear" type="button" value="关闭"></div>'+
            '</div>'+
            //宝宝详细信息
            '<div class="look-Detaildata" v-if="showDetail === '+"'baby'"+'">'+
                '<h3>宝宝详细信息: </h3>'+
                '<div>注册时间: <input type="text" :value="$formatDate(baby_detail.registTime)" disabled></div>'+
                '<div>姓名: <input type="text" :value="baby_detail.babyName" disabled></div>'+
                '<div>性别: <input type="text" :value="baby_detail.sex == 0 ? '+"'男' : '女'"+'" disabled></div>'+
                '<div>出生日期: <input type="text" disabled :value="$formatDate(baby_detail.birthday)"></div>'+
                '<div>身高(cm): <input  type="text" :value="baby_detail.height" disabled></div>'+
                '<div>体重(kg): <input  type="text" :value="baby_detail.weight" disabled></div>'+
                '<div>健康状况: <input  type="text" :value="baby_detail.health" disabled></div>'+
                '<div>兴趣爱好: <input  type="text" :value="baby_detail.hobby" disabled></div>'+
                '<div>特长: <input  type="text" :value="baby_detail.specialty" disabled></div>'+
                '<div>过敏史: <input  type="text" :value="baby_detail.allergy" disabled></div>'+
                '<div>考勤卡卡号: <input  type="text" :value="baby_detail.cardNo" disabled></div>'+
                '<div>年级: <input type="text" :value="baby_detail.leadGrade" disabled></div>'+
                '<div>班级: <input type="text" :value="baby_detail.leadClass" disabled></div>'+
                '<div>监护人: <input type="text" :value="baby_detail.parentName" disabled></div>'+
                '<div>监护人关系: <input type="text" :value="baby_detail.parentRelation" disabled></div>'+
                '<div>监护人手机号: <input type="text" :value="baby_detail.phoneNumber" disabled></div>'+
                '<div class="look"><input @click="closeDetail" class="clear" type="button" value="关闭"></div>'+
            '</div>'+
            //教职工详细信息
            '<div class="look-Detaildata" v-if="showDetail === '+"'teacher'"+'">'+
                '<h3>教职工详细信息: </h3>'+
                '<div>注册时间: <input type="text" :value="teacher_detail.registTime" disabled></div>'+
                '<div>姓名: <input type="text" :value="teacher_detail.workerName" disabled></div>'+
                '<div>性别: <input type="text" :value="teacher_detail.sex == 0 ? '+"'男' : '女'"+'" disabled></div>'+
                '<div>年龄: <input type="text" :value="teacher_detail.age" disabled></div>'+
                '<div>学历: <input type="text" :value="teacher_detail.education" disabled></div>'+
                '<div>教师资格证: <input type="text" :value="teacher_detail.certificate" disabled></div>'+
                '<div>普通话: <input type="text" :value="teacher_detail.chinese" disabled></div>'+
                '<div>所在幼儿园ID: <input  type="text" :value="teacher_detail.gartenId" disabled></div>'+
                '<div>考勤卡卡号: <input  type="text" :value="null" disabled></div>'+
                '<div>教职工编号: <input  type="text" :value="teacher_detail.workerId" disabled></div>'+
                '<div>所带班级: <input  type="text" :value="teacher_detail.leadGrade+teacher_detail.leadClass" disabled></div>'+
                '<div>手机号: <input  type="text" :value="teacher_detail.phoneNumber" disabled></div>'+
                '<div class="look"><input @click="closeDetail" class="clear" type="button" value="关闭"></div>'+
            '</div>'+
            //幼儿园详细信息
            '<div class="look-Detaildata" v-if="showDetail === '+"'kindergarten'"+'">'+
                '<h3>幼儿园详细信息</h3>'+
                '<div>注册时间: <input type="text" :value="$formatDate(kindergarten_detail.registTime)" disabled></div>'+
                '<div>幼儿园token: <input type="text" :value="kindergarten_detail.token" disabled></div>'+
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
                '<div class="look"><input @click="closeDetail" class="clear" type="button" value="关闭"></div>'+
            '</div>'+
            //开通界面
            '<div class="look-Detaildata" v-show="dredge.isShow">' +
                '<h3>{{dredge.title}}</h3>'+
                '<div>开通时长: ' +
                    '<select v-model="dredge.monthCount">' +
                        '<option v-for="n in 12" :value="n">{{n}}</option>'+
                    '</select>'+
                '</div>'+
                '<div>开通金额: <input type="text" v-model="dredge.orderPrice"></div>'+
                '<div class="postData">' +
                    '<input class="save" value="确定" @click="dredgeData" type="button">'+
                    '<input class="clear" @click="dredge.isShow=false" value="关闭" type="button">'+
                '</div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                date:date,
                current_usersType: '', //页面加载默认加载家长信息管理从而触发监听事件
                showDetail: '',  //是否显示详细信息
                pageCount:1,
                pageNo:1,
                name:'',
                phoneNumber:'',
                monitorState: 3, //监控功能
                attendanceState:3, //考勤功能
                personCount: '', //记录总人数
                gradeId: null,
                classId: null,
                responseData: null,
                parent_detail:null,
                baby_detail:null,
                teacher_detail:null,
                kindergarten_detail:null,
                //开通数据
                dredge: {
                    isShow: false,
                    title: '',
                    token: token,
                    type: null,
                    monthCount: 1,
                    gartenId: null,
                    parentId: null,
                    babyId: null,
                    orderPrice: null
                },
                //家长数据
                parents: {
                    tableTitle: ['姓名', '手机号', '视频功能', '考勤功能', '隐藏','操作'],
                    tableItem: [],
                    tableTitle_babys:['姓名', '性别','年级', '班级','视频到期日期','考勤到期日期','隐藏','操作'],
                    tableItem_babys:[]
                },
                //宝宝数据
                babys: {
                    tableTitle: ['姓名', '性别', '年级', '班级','隐藏', '操作'],
                    tableType: 'infoManage_babys',
                    tableItem: [],
                },
                //教职工数据
                teachers: { //假数据
                    tableTitle:['姓名', '性别', '年龄', '手机','隐藏', '操作'],
                    tableType: 'infoManage_teachers',
                    tableItem:[]
                },
                // 幼儿园数据
                kindergartens:{
                    tableTitle:['幼儿园名', '手机号', '视频到期日期','考勤到期日期','隐藏','操作'],
                    tableItem:[]
                }
            }
        },
        computed:{
            current_usersData:function () {
                switch(this.current_usersType){
                    case '家长信息管理':
                        return this.parents;
                    case '宝宝信息管理':
                        return this.babys;
                    case '教职工信息管理':
                        return this.teachers;
                    case '幼儿园信息管理':
                        return this.kindergartens;
                }
            },
            //用于请求数据和导出Excel
            personType: function () {
                switch(this.current_usersType){
                    case '家长信息管理':
                        return '家长';
                    case '宝宝信息管理':
                        return '宝宝';
                    case '教职工信息管理':
                        return '教职工';
                    case '幼儿园信息管理':
                        return '';
                }
            },
            baby_search: function () {
                return {
                    token: token,
                    name: this.name,
                    province: address3.province,
                    city: address3.city,
                    countries: address3.counties,
                    pageNo: this.pageNo,
                    gartenId: kindergartens.id,
                    gradeId: this.gradeId,
                    classId: this.classId
                }
            },
            parent_search: function () {
                return {
                    token: token,
                    name: this.name,
                    phoneNumber: this.phoneNumber,
                    province: address3.province,
                    city: address3.city,
                    countries: address3.counties,
                    pageNo: this.pageNo,
                    gartenId: kindergartens.id,
                    monitorState: this.monitorState,
                    attendanceState:this.attendanceState
                }
            },
            worker_search: function () {
                return {
                    token: token,
                    name: this.name,
                    phoneNumber: this.phoneNumber,
                    province: address3.province,
                    city: address3.city,
                    countries: address3.counties,
                    pageNo: this.pageNo,
                    gartenId: kindergartens.id
                }
            },
            xhr:function () {
                var self = this;
                switch(this.current_usersType){
                    case '家长信息管理':
                        return {
                            url: baseUrl + '/parentMessage.do',
                            data: this.parent_search,
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                var tableItem = [];
                                self.personCount = data.count;
                                self.pageCount = data.pageCount;
                                self.responseData = data.info;
                                self.responseData.forEach(function (item,index) {
                                    var parent = {};
                                    tableItem[index] = parent;
                                    parent.name = item.parentInfo.parentName;
                                    parent.phoneNumber = item.parentInfo.phoneNumber;
                                    parent.monitorState = self.$isDredge(item.parentInfo.monitorTime);
                                    parent.attendanceState = self.$isDredge(item.parentInfo.attendanceTime);
                                    parent.operation = {
                                        type: '家长',
                                        action: ['查看','删除']
                                    }
                                });
                                self.parents.tableItem = tableItem;
                            }
                        }
                    case '宝宝信息管理':
                        return {
                            url: baseUrl + '/babyMessage.do',
                            data: this.baby_search,
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                var tableItem = [];
                                self.personCount = data.count;
                                self.pageCount = data.info.pageCount;
                                self.responseData = data.info.list;
                                self.responseData.forEach(function (value,index) {
                                    var baby = {};
                                    tableItem[index] = baby;
                                    baby.name = value.babyName;
                                    baby.sex =  value.sex == 0? '男' : '女';
                                    baby.grade =  value.leadGrade;
                                    baby.class =  value.leadClass;
                                    baby.operation = {
                                        type: '宝宝',
                                        action:['查看','删除']
                                    }
                                });
                                self.babys.tableItem = tableItem;
                            }
                        }
                    case '教职工信息管理':
                        return {
                            url: baseUrl + '/workerMessage.do',
                            data: this.worker_search,
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                var tableItem = [];
                                self.personCount = data.count;
                                self.pageCount = data.info.pageCount;
                                self.responseData = data.info.list;
                                self.responseData.forEach(function (value,index) {
                                    var teacher = {};
                                    tableItem[index] = teacher;
                                    teacher.name = value.workerName;
                                    teacher.sex =  value.sex == 0? '男' : '女';
                                    teacher.age = value.age;
                                    teacher.phoneNumber =  value.phoneNumber;
                                    teacher.operation = {
                                        type: '教职工',
                                        action:['查看','删除']
                                    }
                                });
                                self.teachers.tableItem = tableItem;
                            }
                        }
                    case '幼儿园信息管理':
                        return {
                            url: baseUrl + '/gartenMessage.do',
                            data: {
                                token: token,
                                name: this.name,
                                phoneNumber: this.phoneNumber,
                                province: address3.province,
                                city: address3.city,
                                countries: address3.counties,
                                pageNo: this.pageNo,
                                monitorState: this.monitorState,
                                attendanceState:this.attendanceState
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                self.responseData = data.info.list;
                                self.pageCount = data.info.pageCount;
                                var tableItem = [];
                                self.responseData.forEach(function (value,index) {
                                    var kindergarten = {};
                                    tableItem[index] = kindergarten;
                                    kindergarten.kindergarten = value.gartenName;
                                    kindergarten.phoneNumber = value.phoneNumber;
                                    kindergarten.monitorState = self.$expirationDate(value.monitorTime);
                                    kindergarten.attendanceState = self.$expirationDate(value.attendanceTime);
                                    kindergarten.operation = {
                                        type: '幼儿园',
                                        action: ['查看','开通视频','开通考勤','开通视频+考勤']
                                    }
                                });
                                self.kindergartens.tableItem = tableItem;
                            }
                        }
                }
            }
        },
        watch:{
            xhr:function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            closeDetail: function () {
                this.showDetail = '';
            },
            getOperation: function (index,value,type) {
                var self = this;
                switch(type){
                    case '家长':
                        this.parent_detail = this.responseData[index];
                        switch (value){
                            case '查看':
                                this.showDetail = 'parent';
                                var tableItem_babys = [];
                                this.parent_detail.classManageBigs.forEach(function (value,index) {
                                    var babyItem = {
                                        name: value.babyName,
                                        sex: value.sex == 0? '男' : '女',
                                        grade: value.leadGrade,
                                        class: value.leadClass,
                                        monitorTime: self.$expirationDate(self.parent_detail.parentInfo.monitorTime[index]),
                                        attendanceTime: self.$expirationDate(self.parent_detail.parentInfo.attendanceTime[index]),
                                        operation: {
                                            type: '家长开通',
                                            action: ['开通视频','开通考勤','开通视频+考勤']
                                        }
                                    }
                                    tableItem_babys[index] = babyItem;
                                });
                                this.parents.tableItem_babys = tableItem_babys;
                                break;
                            case '删除':
                                confirm('是否确认删除') &&
                                    $.ajax({
                                        url: url + '/smallcontrol/deleteParent.do',
                                        data: {
                                            token: token,
                                            parentId: self.parent_detail.parentInfo.parentId
                                        },
                                        type: 'post',
                                        success: function (data) {
                                            switch(data.state){
                                                case 1:
                                                    $.ajax(self.xhr);
                                                    alert('删除成功');
                                                    break;
                                                case 2:
                                                    alert('该家长是宝宝的主监护人,请先更改宝宝的主监护人');
                                                    break;
                                            }
                                        },error: function () {
                                            alert('删除失败');
                                        }
                                    });
                                break;
                        }
                        break;
                    case '宝宝':
                        this.baby_detail = this.responseData[index];
                        switch (value){
                            case '查看':
                                this.showDetail = 'baby';
                                break;
                            case '删除':
                                confirm('是否确认删除') &&
                                $.ajax({
                                    url: url + '/smallcontrol/deleteBaby.do',
                                    data: {
                                        token: token,
                                        babyId: self.baby_detail.babyId
                                    },
                                    type: 'post',
                                    success: function (data) {
                                        switch(data.state){
                                            case 1:
                                                $.ajax(self.xhr);
                                                alert('删除成功');
                                                break;
                                        }
                                    },error: function () {
                                        alert('删除失败');
                                    }
                                });
                                break;
                        }
                        break;
                    case '教职工':
                        this.teacher_detail = this.responseData[index];
                        switch (value){
                            case '查看':
                                this.showDetail = 'teacher';
                                break;
                            case '删除':
                                confirm('是否确认删除') &&
                                $.ajax({
                                    url: url + '/smallcontrol/deleteTeacher.do',
                                    data: {
                                        token: token,
                                        workerIdId: self.teacher_detail.workerId
                                    },
                                    type: 'post',
                                    success: function (data) {
                                        switch(data.state){
                                            case 1:
                                                $.ajax(self.xhr);
                                                alert('删除成功');
                                                break;
                                        }
                                    },error: function () {
                                        alert('删除失败');
                                    }
                                });
                                break;
                        }
                        break;
                    case '幼儿园':
                        var dredge = this.dredge;
                        this.kindergarten_detail = this.responseData[index];
                        switch (value){
                            case '查看':
                                this.showDetail = 'kindergarten';
                                break;
                            case '开通视频':
                            case '开通考勤':
                            case '开通视频+考勤':
                                dredge.isShow = true;
                                dredge.gartenId = self.kindergarten_detail.gartenId;
                                dredge.title = this.kindergarten_detail.gartenName + '幼儿园 ' + value;
                                switch(value){
                                    case '开通视频':
                                        dredge.type = 2;
                                        break;
                                    case '开通考勤':
                                        dredge.type = 3;
                                        break;
                                    case '开通视频+考勤':
                                        dredge.type = 6;
                                        break;
                                }
                                break;
                        }
                        break;
                    case '家长开通':
                        var dredge = this.dredge;
                        dredge.isShow = true;
                        dredge.gartenId = this.parent_detail.classManageBigs[index].gartenId;
                        dredge.parentId = this.parent_detail.parentInfo.parentId;
                        dredge.babyId = this.parent_detail.classManageBigs[index].babyId;
                        dredge.title = this.parent_detail.parentInfo.parentName + '家长 ' + value;
                        switch(value){
                            case '开通视频':
                                dredge.type = 4;
                                break;
                            case '开通考勤':
                                dredge.type = 5;
                                break;
                            case '开通视频+考勤':
                                dredge.type = 7;
                                break;
                        }
                        break;
                }
            },
            dredgeData: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/alipay.do',
                    data: this.dredge,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert(self.dredge.title + '成功');
                            self.dredge.isShow = false;
                        }else {
                            alert(self.dredge.title +'失败');
                        }
                    },
                    error: function () {
                        alert(self.dredge.title +'失败');
                    }
                });
            },
            exportExcel: function () {
                var url = baseUrl;
                var search_data = null;
                switch(this.personType){
                    case '宝宝':
                        url += '/exportBaby.do?';
                        search_data = this.baby_search;
                        break;
                    case '家长':
                        url += '/exportParent.do?';
                        search_data = this.parent_search;
                        break;
                    case '教职工':
                        url += '/exportWorker.do?';
                        search_data = this.worker_search;
                        break;
                }
                location.href = url + this.$objToSearch(search_data);
            }
        },
        beforeMount:function () {
            this.current_usersType = '幼儿园信息管理';
        }
    });
    // 幼儿园管理
    var kindergartenManage = Vue.component('kindergarten-manage',{
        template:
        '<div class="kindergartenManage">'+
             '<div class="nav" @click="showTab($event)">'+
                 '<div :class="{current:show_current === '+"'幼儿园列表'"+'}">幼儿园列表</div>'+
                 '<div :class="{current:show_current === '+"'幼儿园添加'"+'}">幼儿园添加</div>'+
             '</div>'+
             '<div class="search" v-show="show_current === '+"'幼儿园列表'"+'">'+
                '<div class="filter">' +
                    '幼儿园名称:&nbsp&nbsp<input v-model="name"  type="text">'+
                    '手机:&nbsp&nbsp<input v-model="phoneNumber"  type="text">'+
                    '<public-address3></public-address3>'+
                    '<div class="btn-skyblue" @click="exportExcel">导出幼儿园列表</div>'+
                '</div>'+
                '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>' +
                '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
             '</div>'+
             '<div class="add-Newdata" v-show="show_current === '+"'幼儿园添加'"+'">' +
                 '<h3>幼儿园添加</h3>'+
                 '<div>*幼儿园名: <input v-model="kindergarten_add.gartenName" type="text"></div>'+
                 '<div>*幼儿园类型: <public-gartenType @giveGartenType="$getGartenType($event,'+"'kindergarten_add'"+')"></public-gartenType></div>'+
                 '<div>*联系人:&nbsp&nbsp&nbsp <input v-model="kindergarten_add.name" type="text"></div>'+
                 '<div>*联系方式: <input v-model="kindergarten_add.phoneNumber" type="text"></div>'+
                 '<div>*合同编号: <input v-model="kindergarten_add.contractNumber" type="text"></div>'+
                 '<div>*合同起始日期: <public-date v-on:giveTimes="getContractStart"></public-date></div>'+
                 '<div>*合同截止日期: <public-date v-on:giveTimes="getContractEnd"></public-date></div>'+
                 '<div>*省市区: <public-address3></public-address3></div>'+
                 '<div>*幼儿园等级: ' +
                    '<select v-model="kindergarten_add.gartenGrade">' +
                         '<option v-for="n in 9">{{n}}</option>'+
                    '</select>'+
                 '</div>'+
                 '<div class="postData"><input @click="addKindergarten" class="save" type="button" value="保存"></div>'+
             '</div>'+
             '<div class="look-Detaildata" v-if="show_detail">'+
                '<h3>幼儿园详细信息</h3>'+
                '<div>注册时间: <input type="text" :value="$formatDate(kindergarten_detail.registTime)" disabled></div>'+
                '<div>幼儿园token: <input type="text" :value="kindergarten_detail.token" disabled></div>'+
                '<div>幼儿园名: <input type="text" v-model="kindergarten_detail.gartenName"></div>'+
                '<div>幼儿园类型: <public-gartenType @giveGartenType="$getGartenType($event,'+"'kindergarten_detail'"+')" :gartenType="kindergarten_detail.gartenType"></public-gartenType></div>'+
                '<div>幼儿园ID: <input type="text" :value="kindergarten_detail.gartenId" disabled></div>'+
                '<div>联系人: <input type="text" disabled :value="kindergarten_detail.name"></div>'+
                '<div>联系方式: <input type="text" v-model="kindergarten_detail.phoneNumber"></div>'+
                '<div>合同编号: <input type="text" v-model="kindergarten_detail.contractNumber"></div>'+
                '<div>合同起始日期: <public-date v-on:giveTimes="getContractStart_alter" :date="kindergarten_detail.contractStart"></public-date></div>'+
                '<div>合同截止日期: <public-date v-on:giveTimes="getContractEnd_alter" :date="kindergarten_detail.contractEnd"></public-date></div>'+
                '<div>省份: <input type="text" :value="kindergarten_detail.province" disabled></div>'+
                '<div>城市: <input type="text" :value="kindergarten_detail.city" disabled></div>'+
                '<div>县区: <input type="text" :value="kindergarten_detail.countries" disabled></div>'+
                '<div>详细地址: <input type="text" v-model="kindergarten_detail.address"></div>'+
                '<div>冻结状态: ' +
                    '<select disabled :value="kindergarten_detail.accountState">' +
                        '<option :value="0">正常</option>'+
                        '<option :value="1">冻结中</option>'+
                    '</select>'+
                '</div>'+
                '<div>幼儿园学费标准: <input type="text" v-model="kindergarten_detail.charge"></div>'+
                '<div class="postData">' +
                    '<input @click="alterKindergarten" class="save" type="button" value="修改">'+
                    '<input @click="clear_detail" class="clear" type="button" value="关闭">' +
                '</div>'+
             '</div>'+
             '<div class="look-Detaildata" v-if="show_setAgent">' +
                '<h3>代理设置</h3>'+
                '<div>类型: ' +
                    '<select v-model="kindergarten_detail.agentType">' +
                        '<option :value="0">员工</option>'+
                        '<option :value="1">代理商</option>'+
                    '</select>' +
                '</div>'+
                '<div v-if="kindergarten_detail.agentType == 1">' +
                    '<public-address3 :_province="kindergarten_detail.agentInfo? kindergarten_detail.agentInfo.province : null" :_city="kindergarten_detail.agentInfo? kindergarten_detail.agentInfo.city : null" :_counties="kindergarten_detail.agentInfo? kindergarten_detail.agentInfo.countries : null"></public-address3>'+
                    '<public-agents :_agentId="kindergarten_detail.agentInfo? kindergarten_detail.agentInfo.agentId : null"></public-agents>'+
                '</div>'+
                '<div v-if="kindergarten_detail.agentType == 0">' +
                    '<public-dje @giveDje="$getDje($event)" :d="kindergarten_detail.employee? kindergarten_detail.employee.departmentNo : null" :j="kindergarten_detail.employee? kindergarten_detail.employee.jobsNo : null" :e="kindergarten_detail.employee? kindergarten_detail.employee.employeeNo :null"></public-dje>'+
                '</div>'+
                '<div class="postData">' +
                    '<input @click="setAgent" class="save" value="保存" type="button">' +
                    '<input @click="show_setAgent=false" class="clear" value="取消" type="button">' +
                '</div>'+
             '</div>'+
        '</div>',
        data: function () {
            return {
                index:0,
                show_current: '幼儿园列表',
                show_detail:false, //是否显示幼儿园详细信息
                name:'',
                phoneNumber: '',
                pageNo:1,
                pageCount:2,
                responseData:null, //存放请求过来的list
                kindergarten_detail:null, //存放点击查看后的那条记录
                //幼儿园添加参数 绑定到视图
                kindergarten_add: {
                    token:token,
                    gartenGrade:1,
                    attendanceTime:'',
                    monitorTime: '',
                    gartenName:'',
                    gartenType: null,
                    name:'',
                    phoneNumber:'',
                    contractNumber:'',
                    contractStart:'',
                    contractEnd:'',
                    province:'',
                    city:'',
                    countries:'',
                    // address:'',
                },
                tableTitle: ['幼儿园', '联系人','联系方式', '注册时间', '合同起始日期','合同截止日期','隐藏', '操作'],
                tableItem: [],
                mustFill: ['gartenName', 'name', 'phoneNumber', 'contractNumber', 'contractStart', 'contractEnd', 'province', 'city', 'countries'],
                show_setAgent: false,
                employeeNo: null,
            }
        },
        computed: {
            filter_data: function () {
                return {
                    token: token,
                    name:this.name,
                    phoneNumber: this.phoneNumber,
                    province:address3.province,
                    city: address3.city,
                    countries: address3.counties,
                    pageNo: this.pageNo
                }
            },
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/gartenMessage.do',
                    data: this.filter_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        var tableItem = [];
                        self.responseData.forEach(function (value,index) {
                            var o = {
                                kindergarten: value.gartenName,
                                agentPerson: value.name,
                                phoneNumber: value.phoneNumber,
                                registerTime: self.$formatDate(value.registTime),
                                contractStartDate: self.$formatDate(value.contractStart),
                                contractEndDate: self.$formatDate(value.contractEnd),
                                operation: {
                                    action: ['查看/修改','代理设置']
                                }
                            };
                            tableItem[index] = o;
                            var action = o.operation.action;
                            if(value.accountState === 0){
                                action[action.length] = '冻结';
                            }else if (value.accountState === 1){
                                action[action.length] = '解冻';
                            }
                            action[action.length] = '删除';
                        });
                        self.tableItem = tableItem;
                    }
                }
            },
        },
        watch:{
            filter_data: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
            showTab:function (e) {
                var target = e.target.innerHTML;
                switch(target){
                    case '幼儿园列表':
                        this.show_current = '幼儿园列表';
                        break;
                    case '幼儿园添加':
                        this.show_current = '幼儿园添加';
                        break;
                }
            },
            getOperation:function (index,value) {
                var self = this;
                this.index = index;
                this.kindergarten_detail = JSON.parse(JSON.stringify(this.responseData[index]));
                var detail_data = this.kindergarten_detail;
                switch(value){
                    case '查看/修改':
                        this.show_detail = value;
                        break;
                    case '代理设置':
                        this.show_setAgent = true;

                        break;
                    case '冻结':
                    case '解冻':
                        confirm('确认'+value)&&
                            $.ajax({
                                url: baseUrl + '/accountGarten.do',
                                data: {
                                    token: token,
                                    gartenId: self.kindergarten_detail.gartenId,
                                    accountState: value === '冻结'? 1 : 0
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state === 1){
                                        $.ajax(self.xhr);
                                        alert(value + '成功');
                                    }else{
                                        alert(value + '失败');
                                    }
                                }
                            });
                        break;
                    case '删除':
                        var promptInfo = prompt('您正在删除\"'+this.kindergarten_detail.gartenName+'\",如需删除,请填写该幼儿园的名字');
                        if(promptInfo !== this.kindergarten_detail.gartenName){
                            alert('幼儿园名称输入错误,删除失败');
                            return;
                        }
                        $.ajax({
                            url: baseUrl + '/deleteGarten.do',
                            data: {
                                token: token,
                                gartenId: self.kindergarten_detail.gartenId
                            },
                            type: 'post',
                            success: function (data) {
                                switch(data.state){
                                    case 0:
                                        alert('删除失败');
                                        break;
                                    case 1:
                                        $.ajax(self.xhr);
                                        alert('删除成功,后台正在处理,请耐心等待');
                                        break;
                                }
                            },error: function () {
                                alert('删除失败');
                            }
                        });
                        break;
                }
            },
            clear_detail:function () {
                this.show_detail = false;
            },
            getAttendanceTime: function (timestamp) {
                this.kindergarten_add.attendanceTime = 946656000; //幼儿园自身已无需开通这个功能 默认传2000,01,01 的时间戳
            },
            getMonitorTime: function (timestamp) {
                this.kindergarten_add.monitorTime = 946656000;
            },
            getContractStart: function (timestamp) {
                this.kindergarten_add.contractStart = timestamp;
            },
            getContractEnd: function (timestamp) {
                this.kindergarten_add.contractEnd = timestamp;
            },
            addKindergarten: function () {
                var self = this,key = '';
                this.kindergarten_add.monitorTime = 946656000; //默认2000-01-01
                this.kindergarten_add.attendanceTime = 946656000;
                this.kindergarten_add.province = address3.province;
                this.kindergarten_add.city = address3.city;
                this.kindergarten_add.countries = address3.counties;
                if(this.$isNotFilled(this.kindergarten_add)) return;
                // for(key in this.kindergarten_add){
                //     if(!this.kindergarten_add[key]){
                //         alert('带*号的为必填项,请填写完整'+key + ':' + this.kindergarten_add[key]);
                //         return;
                //     };
                // }
                loader.show = true;
                $.ajax({
                    url: baseUrl + '/addGarten.do',
                    data: self.kindergarten_add,
                    type: 'post',
                    success: function (data) {
                        loader.show = false;
                        switch(data.state){
                            case 0: return;
                            case 1:
                                $.ajax(self.xhr);
                                alert('幼儿园添加成功');
                                self.show_current = '幼儿园列表';
                                break;
                            case 2:
                                alert('该手机号已注册');
                                break;
                        }
                    },error: function () {
                        alert('添加失败');
                        loader.show = false;
                    }
                });
            },
            getContractStart_alter: function (timestamp) {
                this.kindergarten_detail.contractStart = timestamp;
            },
            getContractEnd_alter: function (timestamp) {
                this.kindergarten_detail.contractEnd = timestamp;
            },
            alterKindergarten: function () {
                var self = this;
                this.kindergarten_detail.token = token;
                if(this.$isNotFilled(this.kindergarten_detail,this.mustFill)) return;
                confirm('是否确认修改')&&
                $.ajax({
                    url: baseUrl + '/updateGarten.do',
                    data: this.kindergarten_detail,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('修改失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                self.show_detail = false;
                                alert('修改成功');
                                break;
                            case 2:
                                alert('该手机号已注册');
                                break;
                        }
                    },error: function () {
                        alert('修改失败');
                    }
                });
            },
            exportExcel: function () {
                $.ajax({
                    url: baseUrl + '/exportGarten.do',
                    data: this.filter_data,
                    type: 'post'
                });
            },
            setAgent: function () {
                var self = this;
                var data = {
                    token: token,
                    gartenId: this.kindergarten_detail.gartenId,
                    agentType: this.kindergarten_detail.agentType,
                    get agentId(){
                        switch(this.agentType){
                            case 0:
                                return self.employeeNo;
                            case 1:
                                return agents.id;
                        }
                    }
                }
                $.ajax({
                    url: baseUrl + '/changeAgent.do',
                    data: data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('修改成功');
                            self.show_setAgent = false;
                        }
                    }
                });
            }
        },
        beforeMount:function () {
            $.ajax(this.xhr);
        }
    });
    //考勤卡管理
    var attendanceCardManage = Vue.component('attendanceCard-manage',{
        template:
        '<div class="attendanceCardManage">' +
            '<div class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_current === '+"'考勤卡管理'"+'}">考勤卡管理</div>'+
            '</div>'+
            '<div class="filter">' +
                '<public-address3></public-address3>'+
                '<public-kindergartens></public-kindergartens>'+
                '<select v-model="job">' +
                    '<option :value="null">类型</option>'+
                    '<option>宝宝</option>'+
                    '<option>教职工</option>'+
                '</select>'+
                '<public-gradeAndClass v-on:giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>'+
                '<div @click="exportCard" class="btn-skyblue">导出考勤卡</div>'+
                '<label class="btn-skyblue" for="importCard"><input style="display:none" id="importCard" @change="importCard($event)" class="btn" type="file">导入考勤卡</label>'+
            '</div>'+
            '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>'+
            '<div class="look-Detaildata" v-if="show_bindCard">' +
                '<h3>考勤卡绑定、补领</h3>'+
                '<div>姓名*: <input :value="detail_data.name" type="text" disabled></div>'+
                '<div>考勤卡卡号: <input v-model="bindCard_data.cardNo" type="text"></div>'+
                '<div class="postData"><input @click="bindCard" class="save" type="button" value="绑定">&nbsp&nbsp&nbsp&nbsp<input @click="show_bindCard=false" class="clear" type="button" value="取消"></div>'+
            '</div>'+
            '<div class="look-Detaildata" v-if="show_unbindCard">' +
                '<h3>考勤卡解绑</h3>'+
                '<div>姓名*: <input type="text" disabled :value="detail_data.name"></div>'+
                '<div>' +
                    '选择考勤卡卡号:' +
                    '<select v-model="unbindCard_data.cardNo">' +
                    '<option :value="null">考勤卡卡号</option>'+
                    '<option v-if="detail_data.cardNo1">{{detail_data.cardNo1}}</option>'+
                    '<option v-if="detail_data.cardNo2">{{detail_data.cardNo2}}</option>'+
                    '<option v-if="detail_data.cardNo3">{{detail_data.cardNo3}}</option>'+
                    '</select>'+
                '</div>'+
                '<div class="postData"><input @click="unbindCard" class="save" type="button" value="解绑">&nbsp&nbsp&nbsp&nbsp<input @click="cancelUnbindCard" class="clear" type="button" value="取消"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                cardNo: '', //考勤卡号
                job: null, //身份
                show_bindCard: false,
                show_unbindCard: false,
                replaceCard: false,
                show_current: '考勤卡管理',
                responseData: [],
                detail_data: null,
                bindCard_data: {
                    token: token,
                    jobId: '',
                    cardNo: null,
                },
                unbindCard_data: {
                    token: token,
                    jobId: '',
                    cardNo: null,
                },
                classId: null,
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['类型', '持卡人姓名', '考勤卡号1','考勤卡号2','考勤卡号3', '隐藏', '操作'],
                tableItem: [],
                fr: new FileReader(),
                import_data:{
                    token: token,
                    fileName: '',
                    str: '',
                }
            };
        },
        computed: {
            filter_data: function () {
                return {
                    token: token,
                    province: address3.province,
                    city: address3.city,
                    countries: address3.counties,
                    gartenId: kindergartens.id,
                    pageNo: this.pageNo,
                    job: this.job,
                    classId: this.classId
                }
            },
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/cardNoList.do',
                    data: this.filter_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        var tableItem = [];
                        self.responseData = data.info.list;
                        self.responseData.forEach(function (item,index) {
                            var card = {};
                            card.job = item.job;
                            card.name = item.name;
                            card.cardNo1 = item.cardNo1;
                            card.cardNo2 = item.cardNo2;
                            card.cardNo3 = item.cardNo3;
                            card.operation =  {
                                action: []
                            }
                            var action = card.operation.action;
                            if(!item.cardNo1&&!item.cardNo2&&!item.cardNo3){
                                action.splice(action.length,1,'绑定');
                            }else if(item.cardNo1&&item.cardNo2&&item.cardNo3){
                                action.splice(action.length,1,'解绑');
                            }else {
                                action.splice(action.length,1,'解绑','补领');
                            }
                            tableItem[index] = card;
                        });
                        self.tableItem = tableItem;
                    }
                }
            }
        },
        watch: {
            filter_data: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            showTab:function (e) {
                this.show_current = e.target.innerHTML;
            },
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '绑定':
                    case '补领':
                        this.show_bindCard = true;
                        this.bindCard_data.jobId = this.detail_data.jobId;
                        break;
                    case '解绑':
                        this.show_unbindCard = true;
                        this.unbindCard_data.jobId = this.detail_data.jobId;
                        break;
                }
            },
            bindCard: function () {
                var self = this;
                if(!this.bindCard_data.cardNo){
                    alert('请填写考勤卡卡号');
                    return;
                }
                $.ajax({
                    url: url + '/smallcontrol/bindingCard.do',
                    data: self.bindCard_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                return;
                            case 1:
                                $.ajax(self.xhr);
                                alert( '绑定成功');
                                self.show_bindCard = false;
                                break;
                            case 2:
                                alert('该考勤卡已被绑定，请勿重复绑定');
                                break;
                        }
                    }
                });
            },
            unbindCard: function () {
                var self = this;
                if(!this.unbindCard_data.cardNo){
                    alert('请选择考勤卡卡号');
                    return;
                }
                $.ajax({
                    url: url + '/smallcontrol/cancelBinding.do',
                    data: self.unbindCard_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        $.ajax(self.xhr);
                        alert( '解绑成功');
                        self.show_unbindCard = false;
                        self.unbindCard_data.cardNo = null;
                    }
                });
            },
            cancelUnbindCard: function () {
                this.show_unbindCard=false;
                this.unbindCard_data.cardNo=null;
            },
            exportCard: function () {
                $.ajax({
                    url: baseUrl + '/exportAttendance.do',
                    data: this.filter_data,
                    type: 'post',
                    success: function () {
                        location.href = this.url + '?' + this.data
                    }
                });
            },
            importCard: function (e) {
                var file = e.target.files[0];
                if(!this.$isExcel(file)) return;
                this.import_data.fileName = file.name;
                this.fr.readAsDataURL(file);
            }
        },
        beforeMount: function () {
            var self = this;
            $.ajax(this.xhr);
            this.fr.onload = function (e) {
                var arr = e.target.result.split('base64,');
                    self.import_data.str = arr[arr.length - 1];
                    $.ajax({
                        url: baseUrl + '/importAttendanceNo.do',
                        data: self.import_data,
                        type: 'post',
                        success: function (data) {
                            if(data.state){
                                alert('上传成功');
                            }
                        }
                    });
            }
        }
    });
    //清除考勤异常
    var clearUnusual = Vue.component('clear-unusual',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div class="current">选择要清除考勤异常的幼儿园</div>'+
                '</div>'+
                '<div>'+
                    '<div class="filter">' +
                        '清除日期:'+
                        '<public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>~'+
                        '<public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                        '<public-address3></public-address3>'+
                        '身份类型:'+
                        '<select v-model="identity">' +
                            '<option :value="null">全部</option>'+
                            '<option>教职工</option>'+
                            '<option>宝宝</option>'+
                        '</select>'+
                        '<div @click="clearUnusual" class="btn-skyblue">确认清除</div>'+
                    '</div>'+
                    '<public-table :multiple="true" @giveCheckedIndex="getCheckedIndex" :title="tableTitle" :item="tableItem" ></public-table>' +
                '</div>'+
            '</div>',
        data: function () {
            return {
                identity: null,
                tableTitle: ['幼儿园'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                checkedIndex: [],
            }
        },
        computed: {
            filter_data: function () {
                return {
                    token: token,
                    province:address3.province,
                    city: address3.city,
                    countries: address3.counties,
                }
            },
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/getGarten.do',
                    data: this.filter_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info;
                        self.tableItem = self.responseData.map(function (value,index) {
                            return {
                                gartenName: value.gartenName,
                            }
                        });
                    }
                }
            },
        },
        watch: {
            filter_data: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            getCheckedIndex: function ($event) {
                this.checkedIndex = $event[0];
            },
            clearUnusual: function () {
                var self = this,
                    gartenIds = self.checkedIndex.map(function (item) {
                        return self.responseData[item].gartenId;
                    });
                if(!gartenIds.length){
                    alert('未选择幼儿园');
                    return;
                }
                confirm('是否确认清除') &&
                    $.ajax({
                        url: baseUrl + '/yichangResolve.do',
                        data: {
                            token: token,
                            startTime: this.startTime,
                            endTime: this.endTime,
                            gartenIds: gartenIds,
                            identity: this.identity
                        },
                        type: 'post',
                        traditional: true,
                        success: function (data) {
                            if(data.state){
                                alert('清除成功');
                            }else {
                                alert('清除失败');
                            }
                        }
                    });
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 开园审核
    var kindergartenCheck = Vue.component('kindergarten-check',{
        template:
        '<div class="kindergartenCheck">' +
             '<div class="filter">' +
                '<select v-model="source">' +
                    '<option :value="0">员工提交</option>'+
                    '<option :value="1">代理商提交</option>'+
                '</select>'+
             '</div>'+
             '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
             '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount" ></public-paging>'+
             '<div class="look-Detaildata" v-if="show_detail">'+
                '<h3>幼儿园申请详细信息</h3>'+
                '<div>提交人: <input :value="detail_data.agentName" disabled type="text"></div>'+
                '<div>提交日期: <input type="text" disabled :value="$formatDate(detail_data.registTime)"></div>'+
                '<h3>开园申请信息</h3>'+
                '<div>幼儿园名: <input :value="detail_data.gartenName" type="text" disabled></div>'+
                '<div>幼儿园类型: <public-gartenType disabled :gartenType="detail_data.gartenType"></public-gartenType></div>'+
                '<div>联系人: <input disabled :value="detail_data.name" type="text" ></div>'+
                '<div>联系方式: <input disabled :value="detail_data.phoneNumber" type="text" ></div>'+
                '<div>合同编号: <input :value="detail_data.contractNumber" type="text" disabled></div>'+
                '<div>省市区: <public-address3 :disable="true"></public-address3></div>'+
                '<div>开园费用: <input :value="detail_data.money1" type="text" disabled></div>'+
                '<div>使用设备: <input :value="detail_data.equipment" type="text" disabled></div>'+
                '<div>教职工人数: <input :value="detail_data.workerCount" type="text" disabled></div>'+
                '<div>宝宝人数: <input :value="detail_data.babyCount" type="text" disabled></div>'+
                '<div>年级数: <input :value="detail_data.gradeCount" type="text" disabled></div>'+
                '<div>班级数: <input :value="detail_data.classCount" type="text" disabled></div>'+
                '<div>备注: <input :value="detail_data.remark" type="text" disabled></div>'+
                '<div><input @click="show_detail=false" class="clear" type="button" value="关闭"></div>'+
             '</div>'+
             '<div class="look-Detaildata" v-if="pass_apply">'+
                '<h3>通过申请填写: </h3>'+
                   '<div>幼儿园名称: <input disabled :value="detail_data.gartenName" type="text"></div>'+
                   '<div>*幼儿园等级: ' +
                       '<select v-model="pass_apply_data.gartenGrade">' +
                           '<option v-for="n in 9">{{n}}</option>'+
                       '</select>'+
                   '</div>'+
                   '<div>*合同开始时间: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date></div>'+
                   '<div>*合同结束时间: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date></div>'+
                '<div><input type="button" @click="passApply" class="save" value="确定"> <input @click="pass_apply=false" class="clear" type="button" value="取消"></div>'+
             '</div>'+
            '<div class="look-Detaildata" v-if="noPass_apply">'+
               '<h3>拒绝申请填写: </h3>'+
                    '<div>幼儿园名称: <input disabled :value="detail_data.gartenName" type="text"></div>'+
                    '<div>拒绝申请原因: <textarea v-model="noPass_apply_data.remark"></textarea></div>'+
               '<div><input type="button" @click="noPassApply" class="save" value="确定"> <input @click="noPass_apply=false" class="clear" type="button" value="取消"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                index: 0,
                source: 1, //提交来源 本地提交/代理商提交
                pageNo: 1,
                pageCount: 1,
                startTime: 0,
                endTime: 0,
                responseData: null, //存放当前响应的list数据
                detail_data: null, //存放当前点击的查看详情
                show_detail: false,
                pass_apply: false, //通过申请须填写的
                noPass_apply: false,
                noPass_apply_data: {
                    token: token,
                    auditId: null,
                    remark: '',
                },
                pass_apply_data:{
                    token: token,
                    auditId: '',
                    gartenGrade: 1,
                    attendanceTime: '',
                    monitorTime: '',
                    contractStart: '',
                    contractEnd: '',
                },
                tableTitle: ['提交来源','提交日期','合同编号', '所在城市', '幼儿园名称', '使用设备', '开园费用', '隐藏', '操作'],
                tableItem: []
            }
        },
        computed: {
          xhr: function () {
              var self = this;
              return {
                  url: baseUrl + '/agentAudit.do',
                  data:{
                      token: token,
                      resource: this.source,
                  },
                  type: 'post',
                  success: function (data) {
                      if(data.state !== 1) return;
                      self.pageCount = data.info.pageCount;
                      self.responseData = data.info.list;
                      var tableItem = [];
                      self.responseData.forEach(function (item,index) {
                          var checkInfo = {
                              source: item.resource === 0 ? '员工':'代理商',
                              registTime: self.$formatDate(item.registTime),
                              pactNumber: item.contractNumber,
                              city: item.province + item.city,
                              kindergartenName: item.gartenName,
                              equipment: item.equipment,
                              cashPledge: item.money1,
                              operation: {
                                  action: ['查看详情','通过','不通过']
                              }
                          };//审核信息
                          tableItem[index] = checkInfo;
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
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value) {
                this.index = index;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看详情':
                        this.show_detail = true;
                        address3.current_province = this.detail_data.province;
                        address3.current_city = this.detail_data.city;
                        address3.current_countries = this.detail_data.countries;
                        break;
                    case '通过':
                        this.pass_apply = true;
                        break;
                    case '不通过':
                        this.noPass_apply = true;
                }
            },
            passApply: function () {
                var self = this;
                this.pass_apply_data.auditId = this.detail_data.auditId;
                // this.pass_apply_data.attendanceTime = this.$refs.attendanceTime.current_timestamp;
                this.pass_apply_data.attendanceTime = 946656000; //由于幼儿园已经不存在需要自身开通视频才能使用视频功能的限制,因后台需要,学校考勤到期时间默认传2000年1月1日的时间戳（秒）
                // this.pass_apply_data.monitorTime = this.$refs.monitorTime.current_timestamp;
                this.pass_apply_data.monitorTime = 946656000; //学校视频到期时间默认传2000年1月1日的时间戳（秒）
                this.pass_apply_data.contractStart = this.startTime;
                this.pass_apply_data.contractEnd = this.endTime;
                confirm('是否确认通过申请')&&
                $.ajax({
                    url: baseUrl + '/agreeAgentAudit.do',
                    data: self.pass_apply_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('申请失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                alert('已通过申请');
                                self.pass_apply = false;
                                break;
                            case 2:
                                alert('该手机号已存在');
                                break;
                        }
                    },
                    error: function () {
                        alert('申请失败');
                    }
                });
            },
            noPassApply: function () {
                this.noPass_apply_data.auditId = this.detail_data.auditId;
                $.ajax({
                    url: baseUrl + '/refuseAgentAudit.do',
                    data: this.noPass_apply_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('拒绝成功');
                        }
                    }
                })
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 收费方案 视频、考勤收费价格设置
    var setChargePrice = Vue.component('set-kindergartenPrice',{
        template:
        '<div class="setChargePrice">' +
            '<div  class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_tab === '+"'新增收费方案'"+'}">新增收费方案</div>'+
                '<div :class="{current:show_tab === '+"'现有收费方案'"+'}">现有收费方案</div>'+
            '</div>'+
            '<div class="newChargePlan add-Newdata" v-show="show_tab === '+"'新增收费方案'"+'">' +
                '<h3>幼儿园视频、考勤收费价格设置</h3>'+
                '<div>' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                    '<div class="inlineBlock">' +
                        '*类型: '+
                        '<select v-model="ChargePlan_data.type">' +
                            '<option :value="2">全园开通视频(人均)价格</option>'+
                            '<option :value="3">全园开通考勤(人均)价格</option>'+
                            '<option :value="4">家长开通视频价格</option>'+
                            '<option :value="5">家长开通考勤价格</option>'+
                        '</select>'+
                    '</div>'+
                '</div>'+
                '<div>填写收费标准: </div>'+
                '<div>' +
                    '*1个月：<input v-model="ChargePlan_data.month1"  placeholder="默认单位:元(无需填写)" type="text" >' +
                    '*3个月：<input v-model="ChargePlan_data.month3"  placeholder="默认单位:元(无需填写)" type="text" >' +
                    '*6个月：<input v-model="ChargePlan_data.month6"  placeholder="默认单位:元(无需填写)" type="text" >' +
                    '*12个月：<input v-model="ChargePlan_data.month12"  placeholder="默认单位:元(无需填写)" type="text" >' +
                '</div>'+
                '<div class="postData"><input @click="addNewChargePlan" class="save" type="button" value="保存"></div>'+
                '<p class="mark">注:如果只填省份 则该省下所有市均生效。</p>'+
                '<p class="mark">精确到市，则省下只有该市的收费标准改变，其他没填写的市按省的收费标准算</p>'+
                '<p class="mark">越精确，权限标准越高</p>'+
                '<p class="mark">如果要设置全地区,那么省份选择\"省份\"就行，即什么都不选</p>'+
            '</div>'+
            '<div class="existingChargePlan" v-show="show_tab === '+"'现有收费方案'"+'">' +
                '<div class="filter">' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                    '类型: '+
                    '<select v-model="type">' +
                        '<option :value="2">全园开通视频(人均)价格</option>'+
                        '<option :value="3">全园开通考勤(人均)价格</option>'+
                        '<option :value="4">家长开通视频价格</option>'+
                        '<option :value="5">家长开通考勤价格</option>'+
                    '</select>'+
                '</div>'+
            '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging :pageCount="pageCount"></public-paging>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                current_item:null, //当前点击的那条数据
                type:2, //筛选方案类型
                responseData:[],
                pageNo: 1,
                pageCount: 1,
                show_tab:'',
                ChargePlan_data:{ //新增方案里的数据
                    token: token,
                    type: 2,
                    gartenId: '',
                    province: '',
                    city: '',
                    countries: '',
                    month1: '',
                    month3: '',
                    month6: '',
                    month12: ''
                },
                tableTitle:['省份','城市','县区','幼儿园','1个月','3个月','6个月','12个月','方案类型','隐藏','操作'],
                tableItem:[]
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/gartenCharge.do',
                    data: {
                        token: token,
                        gartenId: kindergartens.id,
                        province: address3.province,
                        city: address3.city,
                        countries: address3.counties,
                        type: this.type,
                        pageNo: 1
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        var tableItem = [];
                        self.responseData.forEach(function (item,index) {
                            var o = {
                                province: item.province,
                                city: item.city,
                                counties: item.countries,
                                kindergarten: item.gartenName,
                                oneMonth: item.month1,
                                threeMonth: item.month3,
                                sixMonth: item.month6,
                                twelveMonth: item.month12,
                                type: item.type,
                                operation: {
                                action: ['删除']
                                }
                            }; //收费方案
                                switch(o.type){
                                    case 2:
                                        o.type = '全园视频';
                                        break;
                                    case 3:
                                        o.type = '全园考勤';
                                        break;
                                    case 4:
                                        o.type = '家长视频';
                                        break;
                                    case 5:
                                        o.type = '家长考勤';
                                        break;
                                    case 6:
                                        o.type = '全园视频+考勤';
                                        break;
                                }
                            tableItem[index] = o;
                        });
                    self.tableItem = tableItem;
                    }
                }
            }
        },
        watch:{
          xhr: function () {
              $.ajax(this.xhr);
          }
        },
        methods:{
            showTab:function (e) {
                var target = e.target.innerHTML;
                switch(target){
                    case '新增收费方案' :
                        this.show_tab = '新增收费方案';
                        break;
                    case '现有收费方案' :
                        this.show_tab = '现有收费方案';
                        break;
                }
            },
            getPageNo:Vue.prototype.$getPageNo,
            addNewChargePlan: function () {
                var self = this,
                    key = '';
                this.ChargePlan_data.province = address3.province;
                this.ChargePlan_data.city = address3.city;
                this.ChargePlan_data.countries = address3.counties;
                this.ChargePlan_data.gartenId = kindergartens.id;
                for(key in this.ChargePlan_data){
                    if(key === 'gartenId' || key === 'province' || key === 'city' || key === 'countries'){
                        continue;
                    }
                    if(!this.ChargePlan_data[key]&&this.ChargePlan_data[key] !==0){
                        alert('*为必填项,请填写完整');
                        return;
                    }
                }

                $.ajax({
                    url: baseUrl + '/addGartenCharge.do',
                    data: self.ChargePlan_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0: return;
                            case 1:  alert('新增方案成功');
                            $.ajax(self.xhr);
                            self.show_tab = '现有收费方案';
                            break;
                            case 2:
                                alert('该方案已存在');
                        }
                    }
                });
            },
            getOperation: function (index,value) {
                var self = this;
                this.index = index;
                this.current_item = this.responseData[this.index];
                switch(value){
                    case '删除':
                        confirm('确认删除')&&
                            $.ajax({
                                url: baseUrl + '/deleteGartenCharge.do',
                                data:{
                                    token: token,
                                    chargeId: self.current_item.chargeId
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state === 1){
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                    }else{
                                        alert('删除失败');
                                    }
                                }
                            })
                        break;
                }
            }
        },
        created:function () {
            this.show_tab = '现有收费方案';
            $.ajax(this.xhr);
        }
    });
    // 推送消息
    var pushInfo = Vue.component('push-info',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'推送消息'"+'}">推送消息</div>'+
                    '<div :class="{current: show_current == '+"'消息历史'"+'}">消息历史</div>'+
                '</div>'+
                '<div v-show="show_current=='+"'推送消息'"+'" class="pushInfo">' +
                    '<div class="filter">' +
                        '消息接受对象:'+
                        '<select v-model="type">' +
                            '<option :value="1">代理商</option>'+
                            '<option :value="2">幼儿园</option>'+
                        '</select>'+
                        '<public-address3></public-address3>'+
                        '<public-agents v-show="type==1"></public-agents>'+
                        '<public-kindergartens v-show="type==2"></public-kindergartens>'+
                        '<select v-show="type==2" v-model="pushInfo_data.type">' +
                            '<option :value="0">全部</option>'+
                            '<option :value="1">园长</option>'+
                            '<option :value="2">家长</option>'+
                            '<option :value="3">教职工</option>'+
                        '</select>'+
                    '</div>'+
                    '<div class="pushInfo-info">' +
                        '<div><span>主题</span><input v-model="pushInfo_data.title" type="text" class="pushInfo-info-title" placeholder="标题"></div>'+
                        '<div class="pushInfo-info-main"><span>正文</span><textarea v-model="pushInfo_data.info"  placeholder="您要推送的消息"></textarea></div>'+
                        '<input @click="pushInfo" class="btn" type="button" value="推送消息">'+
                    '</div>'+
                '</div>'+
                '<div class="infoHistory" v-show="show_current=='+"'消息历史'"+'">' +
                    '<div class="filter">' +
                        '消息历史对象:'+
                        '<select v-model="type">' +
                            '<option :value="1">代理商</option>'+
                            '<option :value="2">幼儿园</option>'+
                        '</select>'+
                        '是否已读:'+
                        '<select v-model="state">' +
                            '<option :value="null">未选择</option>'+
                            '<option :value="1">已读</option>'+
                            '<option :value="0">未读</option>'+
                        '</select>'+
                        '开始日期: '+
                        '<public-date v-on:giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: '+
                        '<public-date v-on:giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                        '<public-address3></public-address3>'+
                        '<public-agents v-show="type==1"></public-agents>'+
                        '<public-kindergartens v-show="type==2"></public-kindergartens>'+
                    '</div>'+
                    '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
                    '<public-paging v-on:givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                    '<div class="look-Detaildata" v-if="show_detail">'+
                        '<h3>通知详情: </h3>'+
                        '<textarea disabled>{{detail_data.message}}</textarea>'+
                        '<div class="look"><input @click="show_detail=false" class="clear" type="button" value="关闭"></div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                type: 1,
                state: null,
                startTime: 0,
                endTime: 0,
                show_current: '消息历史',
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['通知发送人','所发幼儿园','通知发送时间','通知接收对象','标题','内容','隐藏','操作'],
                tableItem:[],
                responseData: [],
                detail_data: null,
                show_detail: false,
                pushInfo_data: {
                    token: token,
                    gartenIds: [],
                    agentIds: [],
                    type:1,
                    title:'',
                    info:'',
                    get agentMessage(){
                        return this.info;
                    }
                }
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                switch(this.type){
                    case 1:
                        return {
                            url: baseUrl + '/findAgentMessage.do',
                            data: {
                                token: token,
                                startTime: this.startTime,
                                endTime: this.endTime,
                                agentId: agents.id,
                                pageNo: this.pageNo,
                                state: this.state
                            },
                            type: 'post',
                            success: function (data) {
                                self.pageCount = data.info.pageCount;
                                self.responseData = data.info.list;
                                self.tableItem = self.responseData.map(function (item) {
                                    return {
                                        fromName: item.employee.name,
                                        toagentName: item.agentInfo.agentName, //发给哪些幼儿园
                                        registTime: self.$formatDate(item.registTime), //发送的时间
                                        targetName: item.agentInfo.name,
                                        title: item.title,
                                        message: item.message,
                                        operation: {
                                            action: ['查看','删除']
                                        }
                                    }
                                });
                            }
                        }
                    case 2:
                        return {
                            url: baseUrl + '/messagelog.do',
                            data: {
                                token: token,
                                start: this.startTime,
                                end: this.endTime,
                                gartenId: kindergartens.id,
                                pageNo: this.pageNo
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    self.pageCount = data.info.pageCount;
                                    self.responseData = data.info.list;
                                    var tableItem = [];
                                    self.responseData.forEach(function (item,index) {
                                        var info = {
                                            fromName: item.fromName, //谁发送的消息 item.fromGartenName
                                            toGartenName: item.toGartenName, //发给哪些幼儿园
                                            registTime: self.$formatDate(item.registTime), //发送的时间
                                            targetName: item.targetName,
                                            title: item.title,
                                            message: item.message,
                                            operation: {
                                                action: ['查看','删除']
                                            }
                                        }
                                        tableItem[index] = info;
                                    });
                                    self.tableItem = tableItem;
                                }
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
                if(/^(推送消息|消息历史)$/.test(target)){
                    this.show_current = target;
                }
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                var success = function (data) {
                    if(data.state){
                        $.ajax(self.xhr);
                        alert('删除成功');
                    }else {
                        alert('删除失败');
                    }
                }
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                    case '删除':
                        if(!confirm('是否确认删除')) return;
                        switch(this.type){
                            case 1:
                                $.ajax({
                                    url: baseUrl + '/deleteAgentMessage.do',
                                    data: {
                                        token: token,
                                        agentMessageId: self.detail_data.agentMessageId
                                    },
                                    type: 'post',
                                    success: function (data) {
                                        success(data);
                                    }
                                })
                                break;
                            case 2:
                                $.ajax({
                                    url: baseUrl +'/deleteMessage.do',
                                    data: {
                                        token: token,
                                        messageId: self.detail_data.messageId
                                    },
                                    type: 'post',
                                    success: function (data) {
                                        success(data);
                                    }
                                });
                                break;
                        }
                        break;
                }
            },
            pushInfo: function () {
                var self = this;
                switch(this.type){
                    case 1:
                        this.pushInfo_data.agentIds = agents.id || agents.ids;
                        $.ajax({
                            url: baseUrl + '/addAgentMessage.do',
                            data: this.pushInfo_data,
                            type: 'post',
                            success: function (data) {
                                $.ajax(self.xhr);
                                self.show_current = '消息历史';
                                if(data.state){
                                    alert('发送成功');
                                }else{
                                    alert('发送失败');
                                }
                            },
                            traditional: true
                        })
                        break;
                    case 2:
                        this.pushInfo_data.gartenIds = kindergartens.id || kindergartens.ids;
                        $.ajax({
                            url: baseUrl + '/sendNotified.do',
                            data: this.pushInfo_data,
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    $.ajax(self.xhr);
                                self.show_current = '消息历史';
                                    alert('发送成功');
                                }else{
                                    alert('发送失败');
                                }
                            },
                            traditional: true
                        });
                        break;

                }

            }
        }
    });
    // 代理商管理
    var agentManage = Vue.component('agent-manage',{
        template:
        '<div class="agentManage">' +
            '<div class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_current === '+"'代理商列表'"+'}">代理商列表</div>'+
                '<div :class="{current:show_current === '+"'代理商添加'"+'}">代理商添加</div>'+
            '</div>'+
            '<div v-show="show_current === '+"'代理商列表'"+'">' +
                '<div class="filter">' +
                    '<public-address3></public-address3>'+
                    '<public-agents></public-agents>'+
                '</div>'+
                '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
                '<public-paging :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>'+
                '<div class="look-Detaildata" v-if="show_detail==='+"'查看/修改'"+'">' +
                    '<h3>查看/修改: </h3>'+
                    '<div>代理商名称: <input v-model="agent_detail.agentName" type="text"></div>'+
                    '<div>代理人姓名: <input v-model="agent_detail.name" type="text"></div>'+
                    '<div>代理商联系方式: <input v-model="agent_detail.phoneNumber"  type="text"></div>'+
                    '<div>代理商区域: ' +
                        '<public-address3 :_province="agent_detail.province" :_city="agent_detail.city" :_counties="agent_detail.countries"></public-address3>'+
                    '</div>'+
                    '<div>代理商等级: ' +
                        '<div>'+
                            '<select disabled :value="agentGrade">' +
                                '<option>一级</option>'+
                                '<option>二级</option>'+
                                '<option>三级</option>'+
                            '</select>'+
                        '</div>'+
                    '</div>'+
                    '<div>代理费: <input v-model="agent_detail.agentMoney" type="text"><span style="color: #ccc"></span></div>'+
                    '<div>信用额度: <input v-model="agent_detail.creditMoney" type="text"><span style="color: #ccc"></span></div>'+
                    '<div>返佣比例: <input v-model="agent_detail.rebate" type="text"><span style="color: #ccc"></span></div>'+
                    // '<div @click="cardFragmentControl($event)">代理商卡号段: ' +
                    //     '<input type="button" class="btn" value="添加卡号段">'+
                    //     '<input style="margin-top:6px" v-for="(segment,index) in agent_detail.cardFragment" v-model="agent_detail.cardFragment[index]" type="text">' +
                    //     '<input type="button" class="btn" value="删除卡号段">'+
                    // '</div>'+
                    '<div>冻结状态: ' +
                        '<select disabled :value="agent_detail.frost">' +
                            '<option :value="0">正常</option>'+
                            '<option :value="1">冻结中</option>'+
                        '</select>'+
                    '</div>'+
                    '<div class="postData"><input @click="agentAlter" class="save" type="button" value="保存">&nbsp&nbsp&nbsp&nbsp<input @click="show_detail=false" class="clear" type="button" value="取消"></div>'+
                '</div>'+
            '</div>'+
            '<div v-show="show_current === '+"'代理商添加'"+'">' +
                '<div class="add-Newdata">' +
                    '<h3>代理商添加: </h3>'+
                    '<div>*代理商名称: <input type="text" v-model="agent_add_data.agentName"></div>'+
                    '<div>*代理人姓名: <input type="text" v-model="agent_add_data.name"></div>'+
                    '<div>*代理商联系方式: <input type="text" v-model="agent_add_data.phoneNumber"></div>'+
                    '<div>*代理区域: ' +
                        '<public-address3></public-address3>'+
                    '</div>'+
                    '<div>代理等级: <input disabled :value="agentGrade" type="text"></div>'+
                    '<div>*加盟费: <input type="text" v-model="agent_add_data.agentMoney"></div>'+
                    '<div>*授信额度: <input type="text" v-model="agent_add_data.creditMoney"></div>'+
                    '<div>*返佣比例(默认带\"%\",不需要填写\"%\"): <input type="text" v-model="agent_add_data.rebate"></div>'+
                    '<div>*代理开始时间: <public-date v-on:giveTimes="getAgentStartTime"></public-date></div>'+
                    '<div>*代理结束时间: <public-date v-on:giveTimes="getAgentEndTime"></public-date></div>'+
                    '<div class="postData"><input class="save" @click="addAgent" type="button" value="保存"></div>'+
                '</div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                index:0, //点击查看/修改时 记录是第几个 在用户修改完信息后如果点保存 就把responseData[this.index]修改掉
                agent_detail: null,
                responseData: null,
                pageNo:1,
                pageCount:1,
                show_current: '代理商列表',
                show_detail: false,
                agent_add_data:{//用于存放代理商添加的数据
                    token: token,
                    phoneNumber: '',
                    agentMoney: '',
                    creditMoney: '',
                    agentStartTime: '',
                    agentEndTime: '',
                    name: '',
                    agentName: '',
                    rebate: '',
                    province: '',
                    city: '',
                    countries: ''
                },
                tableTitle:['代理商名称','代理区域','代理等级','代理费','授信额度','返佣比例(%)','隐藏','操作'],
                tableItem: []
            }
        },
        computed:{
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/agentMessge.do',
                    data: {
                        token: token,
                        province: address3.province,
                        city: address3.city,
                        countries: address3.counties,
                        agentId: agents.id,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        var tableItem = [];
                        self.responseData.forEach(function (item,index) {
                            var agent = {
                                agentName: item.agentName,
                                agentArea: (item.province + item.city + item.countries).replace(/null/g,''),
                                agentGrade: item.agentGrade,
                                agencyFee: item.agentMoney,
                                creditMoney: item.creditMoney,
                                commissionRatio: item.rebate,
                                operation: {
                                    action:['查看/修改']
                            }
                            };

                            var action = agent.operation.action;
                            if(item.frost == 0 ){
                                action[action.length] = '冻结';
                            }else if(item.frost == 1){
                                action[action.length] = '解冻';
                                action[action.length] = '删除';
                            }
                            tableItem[index] = agent;
                        });
                        self.tableItem = tableItem;
                    }
                }
            },
            agentGrade: function () {
                return address3.grade;
            }

        },
        watch : {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getPageNo: Vue.prototype.$getPageNo,
            showTab:function (e) {
                var target = e.target.innerHTML;
                if(target !== '代理商列表' && target !== '代理商添加') return;
                this.show_current = target;
            },
            getOperation:function (index,value) {
                var self = this;
                this.index = index;
                switch(value){
                    case '查看/修改':
                         //用于点击保存后替换数据
                        this.show_detail = '查看/修改';
                        this.agent_detail = JSON.parse(JSON.stringify(this.responseData[index]));
                        break;
                    case '删除':
                    case '冻结':
                    case '解冻':
                        var url = '';
                        if(value === '冻结'){
                            url = baseUrl + '/frostAgentMessge.do';
                        }else if(value === '解冻'){
                            url = baseUrl + '/unfrostAgentMessge.do';
                        }else if(value === '删除'){
                            url = baseUrl + '/deleteAgentMessge.do';
                        }
                        confirm('确认'+value)&&
                        $.ajax({
                            url: url,
                            data:{
                                token: token,
                                agentId:self.responseData[index].agentId,
                            },
                            type: 'post',
                            success: function (data) {
                                var state = data.state !== 1? '请求错误' : value+'成功';
                                alert(state);
                                $.ajax(self.xhr);
                            }
                        })
                        break;
                }
            },
            cardFragmentControl:function (e) {
                if(!this.agent_detail.cardFragment){
                    this.agent_detail.cardFragment = [];
                }
                switch (e.target.value){
                    case '添加卡号段':
                        this.agent_detail.cardFragment.splice(this.agent_detail.cardFragment.length,0,'');
                        break;
                    case '删除卡号段':
                        this.agent_detail.cardFragment.splice(this.agent_detail.cardFragment.length-1,1);
                        break;
                }
            },
            //修改后点击保存向服务器提交数据
            agentAlter: function () {
                var self = this;
                this.agent_detail.token = token;
                this.agent_detail.province = address3.province;
                this.agent_detail.city = address3.city;
                this.agent_detail.countries = address3.counties;
                this.agent_detail.cardFragment = this.agent_detail.cardFragment;
                loader.show = true;
                $.ajax({
                    url: baseUrl + '/updateAgentMessge.do',
                    data: this.agent_detail,
                    type: 'post',
                    traditional: true,
                    success: function (data) {
                        loader.show = false;
                        switch(data.state){
                            case 0: return;
                            case 1:
                                self.show_detail = false;
                                $.ajax(self.xhr);
                                alert('修改成功');
                                break;
                            case 2:
                                alert('地址冲突');
                            case 3:
                                alert('该手机号已注册');
                        }
                    },
                    error: function () {
                        loader.show = false;
                    }
                });
            },
            //添加代理商-保存
            addAgent: function () {
                var self = this,
                    key = '';
                this.agent_add_data.token = token;
                this.agent_add_data.province = address3.province;
                this.agent_add_data.city = address3.city;
                this.agent_add_data.countries = address3.counties;
                for(key in this.agent_add_data){
                    if(key === 'city' || key === 'countries'){
                        continue;
                    }
                    if(!this.agent_add_data[key]){
                        alert('*为必填项,请填写完整' + key);
                        return;
                    }
                }
                $.ajax({
                    url: baseUrl + '/addAgentMessge.do',
                    data: self.agent_add_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('添加代理商失败');
                                return;
                            case 1:
                                $.ajax(self.xhr);
                                alert('添加代理商成功');
                                self.show_current = '代理商列表';
                                break;
                            case 2:
                                alert('添加失败,该地址已有其他代理商代理');
                                break;
                            case 3:
                                alert('该手机号码已被注册');
                                break;
                        }
                    }
                });
            },
            //添加代理商时的代理商起始日期
            getAgentStartTime: function (timestamp) {
                this.agent_add_data.agentStartTime = timestamp;
            },
            //添加代理商时的代理商截止日期
            getAgentEndTime: function (timestamp) {
                this.agent_add_data.agentEndTime = timestamp;
            }

        },
        created:function () {
            $.ajax(this.xhr);
        }
    });
    // 代理商业绩统计  和员工业绩统计调用同一接口
    var agentPerformance = Vue.component('agent-performance',{
        template:
        '<div class="agentPerformance">' +
            '<div class="filter">' +
                '<public-address3></public-address3>' +
                '<public-agents></public-agents>' +
            '</div>' +
            '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging @givePageNo="$getPageNo($event)"></public-paging>'+
        '</div>',
        data:function () {
            return {
                tableTitle:['代理商名称','幼儿园名称','开园人姓名','开园费用','开园时间'],
                tableItem: [],
                pageNo: 1,
                pageCount: 1,
                responseData: null,
                detail_data: null
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/agentPerformance.do',
                    data: {
                        token: token,
                        agentId: agents.id,
                        province: address3.province,
                        city: agents.city,
                        countries: agents.countries,
                        state: 1, //默认已开通
                        pageNo: this.pageNo,
                        resource: 1
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    agentName: item.agentInfo.agentName,
                                    gartenName:item.gartenName,
                                    name: item.agentInfo.name,
                                    money1: item.money1,
                                    registTime: self.$formatDate(item.registTime)
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
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 代理商考勤卡
    var agentCard = Vue.component('agent-card',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'考勤卡列表'"+'}">代理商考勤卡列表</div>'+
                '</div>'+
                '<div v-show="show_current == '+"'代理商考勤卡列表'"+'">' +
                    '<div class="filter">' +
                        '<public-address3></public-address3>'+
                        '<public-agents></public-agents>'+
                        '<span>{{"考勤卡总数:"+count}}</span>'+
                        '<div @click="downCardTemplate" value="" class="btn-skyblue">下载考勤卡模板</div>'+
                        '<div @click="importCard"  class="btn-skyblue">导入考勤卡</div>'+
                        '<div @click="exportCard"  class="btn-skyblue">导出考勤卡</div>'+
                    '</div>'+
                    '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                    '<div class="look-Detaildata" v-show="import_data.show">' +
                        '<h3>导入考勤卡</h3>'+
                        '<div>*选择Excel文件: <input @change="reader($event)" type="file"></div>'+
                        '<div>考勤卡押金(没有不填): <input v-model="import_data.returnMoney" type="text"></div>'+
                    '<div class="postData">' +
                        '<input @click="importData" class="save" value="保存" type="button">' +
                        '<input @click="import_data.show = false" class="clear" value="取消" type="button">' +
                    '</div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                show_current: '代理商考勤卡列表',
                pageNo: 1,
                pageCount: 1,
                count: '',
                tableTitle: ['内卡号','外卡号','押金'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                import_data: {
                    token: token,
                    show: false,
                    str: null,
                    agentId: null,
                    agentType: 1,
                    returnMoney: null,
                    fileName: ''
                },
                fr: new FileReader(),
                mustFill: ['str']
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/cardList.do',
                    data: {
                        token: token,
                        id: agents.id,
                        agentType: 1,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.count = data.count;
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    inCard: item.inCard,
                                    outCard: item.outCard,
                                    returnMoney: item.returnMoney,
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
                var target = e.target.innerHTML;
                if(/^(代理商考勤卡列表)$/.test(this.show_current)) return;
                this.show_current = target;
            },
            // getOperation: function (index,value,type) {
            //     var self = this;
            //     this.detail_data = this.responseData[index];
            //     switch(value){
            //         case '退还押金':
            //
            //             break;
            //
            //     }
            // },
            downCardTemplate: function () {
                location.href = baseUrl + '/downloadCardTemplate.do?token=' + token;
            },
            reader: function (e) {
                var file = e.target.files[0];
                if(!this.$isExcel(file)) return;
                this.import_data.fileName = file.name;
                this.fr.readAsDataURL(file);
            },
            importCard: function () {
                if(!agents.id){
                    alert('未选择代理商');
                    return;
                }
                this.import_data.show = true;
                this.import_data.agentId = agents.id;

            },
            importData: function () {
                var self = this;
                if(this.$isNotFilled(this.import_data,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/importCard.do',
                    data: this.import_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('导入成功');
                            self.import_data.show = false;
                        }else {
                            alert('文件未上传或上传错误');
                        }
                    },
                    error: function () {
                        alert('导入失败');
                    }
                });
            },
            exportCard: function () {
                if(!agents.id){
                    alert('未选择代理商');
                    return;
                }
                location.href = baseUrl + '/exportCard.do?' + 'agentId=' + agents.id + '&agentType=1';
            }
        },
        created: function () {
            var self = this;
            $.ajax(this.xhr);
            this.fr.onload = function (e) {
                var txt = e.target.result,
                    arr = txt.split('base64,');
                self.import_data.str = arr[arr.length-1];
            }
        }
    });
    // 代理商购买信用额度
    var agentCredit = Vue.component('agent-credit',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div class="current">代理商购买信用额度</div>'+
                '</div>'+
                '<div>' +
                    '<div class="filter">' +
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                        '<public-address3></public-address3>'+
                        '<public-agents></public-agents>'+
                        '支付状态:<select v-model="state">' +
                            '<option :value="null">未选择</option>'+
                            '<option :value="0">未支付</option>'+
                            '<option :value="1">已支付</option>'+
                        '</select>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                startTime: 0,
                endTime: 0,
                state: null,
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['代理商名称','订单编号',	'订单价格', '下单时间', '订单内容', '支付类型', '支付状态', '隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findAgentOrder.do',
                    data: {
                        token: token,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        agentId: agents.id,
                        state: this.state,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem =  self.responseData.map(function (item,index) {
                                return {
                                    agentName: item.agentInfo.agentName,
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
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch (value) {
                    case '删除':
                        confirm('是否确认删除') &&
                        $.ajax({
                            url: url + '/agent/deleteAgentOrder.do',
                            data: {
                                token: token,
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
            }
        }
    });
    // 代理商提现管理
    var drawMoneyManage = Vue.component('draw-money-manage',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div class="current">代理商提现列表</div>'+
                '</div>'+
                '<div>' +
                    '<div class="filter">' +
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                        '<select v-model="state">' +
                            '<option :value="null">提现状态</option>'+
                            '<option :value="0">未处理</option>'+
                            '<option :value="1">已转账</option>'+
                            '<option :value="2">已拒绝</option>'+
                        '</select>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                    '<div v-show="dispose_data.isShow" class="look-Detaildata">' +
                        '<h3>提现处理</h3>'+
                        '<div>提现状态:' +
                            '<select v-model="dispose_data.state">' +
                                '<option :value="null">请选择</option>'+
                                '<option :value="1">已转账</option>'+
                                '<option :value="2">拒绝转账</option>'+
                            '</select>'+
                        '</div>'+
                        '<div>备注说明: <textarea v-model="dispose_data.mark"></textarea></div>'+
                        '<div class="postData">' +
                            '<input @click="disposeData" type="button" value="保存" class="save">' +
                            '<input @click="dispose_data.isShow = false" type="button" value="取消" class="clear">' +
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                startTime: 0,
                endTime: 0,
                state: null,
                pageNo: 1,
                pageCount: 1,
                tableTitle:  ['申请人','申请日期','提现方式','申请金额','申请状态','备注','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                dispose_data: {
                    isShow: false,
                    token: token,
                    withdrawId: null,
                    state: null,
                    mark: '',
                }
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
                        endTime: this.endTime,
                        state: this.state
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.responseData = data.info;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    name: item.agentInfo.name,
                                    registTime: self.$formatDate(item.registTime, true),
                                    receiveType: item.receiveType == 0 ? '支付宝' : '银行卡',
                                    price: item.price,
                                    get state() {
                                        switch (item.state) {
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
                                        get action(){
                                            if(!item.state){
                                                return ['处理'];
                                            }else {
                                                return ['删除']
                                            }
                                        }
                                    }
                                };
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
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '处理':
                        this.dispose_data.isShow = true;
                        this.dispose_data.withdrawId = this.detail_data.withdrawId;
                        break;
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
            disposeData: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/updateWithdraw.do',
                    data: this.dispose_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                self.dispose_data = {
                                    isShow: false,
                                    token: token,
                                    withdrawId: null,
                                    state: null,
                                    mark: '',
                                }
                                $.ajax(self.xhr);
                                alert('处理成功');
                                break;
                        }
                    }
                });
            }
        }
    });
    // 考勤机
    var attendanceMachine = Vue.component('attendance-machine',{
        template:
        '<div class="attendanceMachine">' +
            '<div class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_current === '+"'考勤机列表'"+'}">考勤机列表</div>'+
                '<div :class="{current:show_current === '+"'考勤机添加'"+'}">考勤机添加</div>'+
            '</div>'+

            '<div v-show="show_current==='+"'考勤机列表'"+'">' +
                '<div class="filter">' +
                    '<select v-model="type">' +
                        '<option :value="null">类型</option>'+
                        '<option :value="1">打卡机</option>'+
                        '<option :value="2">闸机</option>'+
                    '</select>'+
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                '</div>'+
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" itemCount="16-tableItem.length"></public-table>'+
                '<public-paging :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current==='+"'考勤机添加'"+'">' +
                '<h3>考勤机添加</h3>'+
                '<div>*选择幼儿园: ' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                '</div>'+
                '<div>*选择类型: ' +
                    '<select v-model="add_data.type">' +
                        '<option :value="null">类型</option>'+
                        '<option :value="1">打卡机</option>'+
                        '<option :value="2">闸机</option>'+
                    '</select>'+
                '</div>'+
                '<div>*MAC地址: <input v-model="add_data.macId" type="text"></div>'+
                '<div class="postData"><input class="save" @click="addData"  type="button" value="保存"></div>'+
            '</div>'+
            '<div class="look-Detaildata" v-if="detail">' +
                '<h3>查看、修改考勤机: </h3>'+
                '<div>幼儿园: <input :value="detail_data.gartenName" type="text" disabled></div>'+
                '<div>类型: <input :value="detail_data.type===1?'+"'打卡机':'闸机'"+'" type="text" disabled></div>'+
                '<div>MAC地址: <input v-model="detail_data.macId" type="text" ></div>'+
                '<div>udid: <input :value="detail_data.partnerId" type="text" disabled></div>'+
                '<div>密匙: <input :value="detail_data.partnerSecret" type="text" disabled></div>'+
                '<div class="postData"><input class="save" @click="alterData" type="button" value="保存"><input @click="detail=false" type="button" class="clear" value="关闭"> </div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '考勤机列表',
                pageNo: 1,
                pageCount: 1,
                type: null,
                add_data: {
                    token: token,
                    type: null,
                    macId: '',
                    gartenId: '',
                },
                responseData: [],
                detail: false, //是否显示详细数据
                detail_data: null, //当前点击的详细数据
                tableTitle: ['幼儿园','类型','MAC地址','udid','密匙','隐藏','操作'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/machineList.do',
                    data: {
                        token: token,
                        type: this.type,
                        province: address3.province,
                        city: address3.city,
                        countries: address3.counties,
                        gartenId: kindergartens.id,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        var tableItem = [];
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.responseData.forEach(function (item,index) {
                            var  machine = {};
                            machine.gartenName = item.gartenName;
                            machine.type = item.type === 1 ? '打卡机' : '闸机';
                            machine.macId = item.macId;
                            machine.partnerId = item.partnerId;
                            machine.partnerSecret = item.partnerSecret;
                            machine.operation = {
                                action: ['查看/修改','删除']
                            }
                            tableItem[index] = machine;
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
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
            showTab: function (e) {
                var txt = e.target.innerText;
                if(txt !== '考勤机列表' && txt !== '考勤机添加') return;
                this.show_current = txt;
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value){
                    case '查看/修改':
                        this.detail = true;
                        break;
                    case '删除':
                       confirm('是否确认删除')&&$.ajax({
                            url: baseUrl + '/deleteMachine.do',
                            data: {
                                token: token,
                                machineId: self.detail_data.machineId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                $.ajax(self.xhr);
                                alert('删除成功');
                            }
                        });
                       break;
                }
            },
            alterData: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/updateMachine.do',
                    data: {
                        token: token,
                        macId: self.detail_data.macId,
                        machineId: self.detail_data.machineId,
                    },
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                alert('修改成功');
                                self.detail = false;
                                break;
                            case 2:
                                alert('mac地址重复');
                                break;
                        }
                    }
                });
            },
            addData: function () {
                var self = this;
                this.add_data.gartenId = kindergartens.id;
                for(var k in this.add_data){
                    if(!this.add_data[k]){
                        alert('*为必填项,请填写完整');
                        return;
                    }
                }
                $.ajax({
                    url: baseUrl + '/addMachine.do',
                    data: self.add_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                alert('添加成功');
                                self.show_current = '考勤机列表';
                                break;
                            case 2:
                                alert('mac地址重复');
                                break;
                        }
                    }
                });
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 考勤摄像头
    var attendanceCamera = Vue.component('attendance-camera',{
        template:
        '<div class="attendanceCamera">' +
            '<div class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_current === '+"'考勤摄像头列表'"+'}">考勤摄像头列表</div>'+
                '<div :class="{current:show_current === '+"'考勤摄像头添加'"+'}">考勤摄像头添加</div>'+
            '</div>'+

            '<div v-show="show_current==='+"'考勤摄像头列表'"+'">' +
                '<div class="filter">' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                '</div>'+
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" itemCount="16-tableItem.length"></public-table>'+
                '<public-paging :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current==='+"'考勤摄像头添加'"+'">' +
                '<h3>考勤摄像头添加</h3>'+
                '<div>*选择幼儿园: ' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                '</div>'+
                '<div>*IP地址: <input v-model="add_data.cameraIp" type="text"></div>'+
                '<div>*端口号: <input v-model="add_data.cameraPort" type="text"></div>'+
                '<div>*用户名: <input v-model="add_data.cameraUser" type="text"></div>'+
                '<div>*密码: <input v-model="add_data.cameraPwd" type="text"></div>'+
                '<div>*朝向: ' +
                    '<select v-model="add_data.type">' +
                        '<option :value="null">朝向</option>'+
                        '<option :value="1">朝向校内</option>'+
                        '<option :value="2">朝向校外</option>'+
                    '</select>'+
                '</div>'+
                '<div>*闸机MAC地址: <input v-model="add_data.macId" type="text"></div>'+
                '<div class="postData"><input class="save" @click="addCamera" type="button" value="保存"></div>'+
            '</div>'+
            '<div class="look-Detaildata" v-if="show_detail">' +
                '<h3>查看/修改</h3>'+
                '<div>幼儿园: <input disabled :value="detail_data.gartenName" type="text"></div>'+
                '<div>IP: <input v-model="detail_data.cameraIp" type="text"></div>'+
                '<div>端口号: <input v-model="detail_data.cameraPort" type="text"></div>'+
                '<div>用户名: <input v-model="detail_data.cameraUser" type="text"></div>'+
                '<div>密码: <input v-model="detail_data.cameraPwd" type="text"></div>'+
                '<div>朝向: ' +
                    '<select v-model="detail_data.type">' +
                        '<option :value="null">朝向</option>'+
                        '<option :value="1">朝向校内</option>'+
                        '<option :value="2">朝向校外</option>'+
                    '</select>'+
                '</div>'+
                '<div>闸机MAC地址: <input v-model="detail_data.macId" type="text"></div>'+
                '<div class="postData"><input class="save" @click="alterCamera"  type="button" value="保存"><input class="clear" @click="show_detail=false" type="button" value="取消"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '',
                pageNo: 1,
                pageCount: 1,
                type: null,
                show_detail: false,
                responseData: [],
                detail_data: null,
                add_data:{
                    token: token,
                    gartenId: null,
                    cameraIp: '',
                    cameraPort: '',
                    cameraUser: '',
                    cameraPwd: '',
                    type: null,
                    macId: '',
                },
                tableTitle: ['幼儿园','摄像头朝向','闸机MAC地址','隐藏','操作'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/getDakaCameraList.do',
                    data: {
                        token: token,
                        gartenId: kindergartens.id,
                        province: address3.province,
                        city: address3.city,
                        countries: address3.counties,
                        pageNo: self.pageNo,
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !==1 ) return;
                        var tableItem = [];
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.responseData.forEach(function (item,index) {
                            var camera = {};
                            camera.gartenName = item.gartenName;
                            camera.type = item.type === 1? '校内' : '校外';
                            camera.macId = item.macId;
                            camera.operation = {
                                action: ['查看/修改', '删除']
                            }
                            tableItem[index] = camera;
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
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
            showTab: function (e) {
                var txt = e.target.innerText;
                if(txt !== '考勤摄像头列表' && txt !== '考勤摄像头添加') return;
                this.show_current = txt;
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value) {
                    case '查看/修改':
                        this.show_detail = true;
                        break;
                    case '删除':
                        confirm('是否确认删除')&&$.ajax({
                            url: baseUrl + '/deleteDakaCamera.do',
                            data: {
                                token: token,
                                cameraId: self.detail_data.cameraId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                $.ajax(self.xhr);
                                alert('删除成功');
                            },
                            error: function () {
                            }
                        });
                }
            },
            addCamera: function () {
                var self = this;
                this.add_data.gartenId = kindergartens.id;
                if(this.$isNotFilled(this.add_data)) return;
                $.ajax({
                    url: baseUrl + '/addDakaCamera.do',
                    data: self.add_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('添加成功');
                            self.show_current = '考勤摄像头列表';
                        }else {
                            alert('设备信息(序列号、验证码)填写错误或已添加');
                        }
                    }
                })
            },
            alterCamera: function () {
                var self = this;
                self.detail_data.token = token;
                for(var k in self.detail_data){
                    if(!self.detail_data[k]){
                        if(k == 'deviceSerial' || k == 'validateCode') continue;
                        alert('请填写完整');
                        return;
                    }
                }
                $.ajax({
                    url: baseUrl + '/updateDakaCamera.do',
                    data: self.detail_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        $.ajax(self.xhr);
                        alert('修改成功');
                        self.show_detail = false;
                    }
                });
            }
        },
        beforeMount: function () {
            this.show_current = '考勤摄像头列表';
            $.ajax(this.xhr);
        }
    });
    // 直播摄像头
    var liveCamera = Vue.component('live-camera',{
        template:
        '<div class="liveCamera">' +
            '<div class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_current === '+"'直播摄像头列表'"+'}">直播摄像头列表</div>'+
                '<div :class="{current:show_current === '+"'直播摄像头添加'"+'}">直播摄像头添加</div>'+
                '<div :class="{current:show_current === '+"'直播摄像头添加(录像机)'"+'}">直播摄像头添加(录像机)</div>'+
            '</div>'+
            '<div v-show="show_current==='+"'直播摄像头列表'"+'">' +
                '<div class="filter">' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                '</div>'+
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
                '<public-paging :pageCount="pageCount" v-on:givePageNo="getPageNo"></public-paging>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current==='+"'直播摄像头添加'"+'">' +
                '<h3>直播摄像头添加</h3>' +
                '<div>*选择幼儿园: ' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                '</div>'+
                '<div>*IP地址: <input v-model="add_data.cameraIp" type="text"></div>'+
                '<div>*端口号: <input v-model="add_data.cameraPort" type="text"></div>'+
                '<div>' +
                    '*使用场所: '+
                    '<select @change="classId=null" v-model="add_data.type">' +
                        '<option :value="null">使用场所</option>'+
                        '<option :value="0">教室</option>'+
                        '<option :value="1">操场</option>'+
                        '<option :value="2">食堂</option>'+
                        '<option :value="3">公共教室</option>'+
                    '</select>'+
                    '<div class="inlineBlock" v-if="add_data.type===0">' +
                    '*对应班级:' +
                    '<public-gradeAndClass v-on:giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>'+
                    '</div>'+
                '</div>'+
                '<div>*用户名: <input v-model="add_data.cameraUser" type="text"></div>'+
                '<div>*密码: <input v-model="add_data.cameraPwd" type="text"></div>'+
                '<div>*序列号: <input v-model="add_data.deviceSerial" type="text"></div>'+
                '<div>*验证码: <input v-model="add_data.validateCode" type="text"></div>'+
                '<div class="postData"><input class="save" @click="addData" type="button" value="保存"></div>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current==='+"'直播摄像头添加(录像机)'"+'">' +
                '<h3>直播摄像头添加(录像机)</h3>' +
                '<div>*选择幼儿园: ' +
                    '<public-address3></public-address3>'+
                    '<public-kindergartens></public-kindergartens>'+
                '</div>'+
                '<div>*IP地址: <input v-model="add_data_vcr.cameraIp" type="text"></div>'+
                '<div>*端口号: <input v-model="add_data_vcr.cameraPort" type="text"></div>'+
                '<div>*url: <input v-model="add_data_vcr.url" type="text"></div>'+
                '<div>' +
                    '*使用场所: '+
                    '<select @change="classId=null" v-model="add_data_vcr.type">' +
                        '<option :value="null">使用场所</option>'+
                        '<option :value="0">教室</option>'+
                        '<option :value="1">食堂</option>'+
                        '<option :value="2">操场</option>'+
                        '<option :value="3">公共教室</option>'+
                    '</select>'+
                    '<div class="inlineBlock" v-if="add_data_vcr.type===0">' +
                        '*对应班级:' +
                        '<public-gradeAndClass v-on:giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>'+
                    '</div>'+
                '</div>'+
                '<div>*用户名: <input v-model="add_data_vcr.cameraUser" type="text"></div>'+
                '<div>*密码: <input v-model="add_data_vcr.cameraPwd" type="text"></div>'+
                '<div>*序列号(录像机): <input v-model="add_data_vcr.deviceSerial" type="text"></div>'+
                '<div>*验证码(录像机): <input v-model="add_data_vcr.validateCode" type="text"></div>'+
                '<div class="postData"><input class="save" @click="addData('+"'vcr'"+')" type="button" value="保存"></div>'+
            '</div>'+
            '<div class="look-Detaildata" v-if="show_detail">' +
                '<h3>查看/修改</h3>'+
                '<div>幼儿园: <input disabled v-model="detail_data.gartenName" type="text"></div>'+
                '<div>*IP地址: <input v-model="detail_data.cameraIp"  type="text"></div>'+
                '<div>*端口号: <input v-model="detail_data.cameraPort"  type="text"></div>'+
                '<div>*直播地址url: <input v-model="detail_data.url"  type="text"></div>'+
                '<div>'+
                    '*使用场所: '+
                    '<select v-model="detail_data.type">' +
                        '<option :value="null">使用场所</option>'+
                        '<option :value="0">教室</option>'+
                        '<option :value="1">食堂</option>'+
                        '<option :value="2">操场</option>'+
                        '<option :value="3">公共教室</option>'+
                    '</select>'+
                '</div>'+
                '<div  v-if="detail_data.type===0">' +
                    '*对应班级:' +
                    '<public-gradeAndClass :_gradeId="detail_data.gartenClass.gradeId" :_classId="detail_data.gartenClass.classId" v-on:giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>'+
                '</div>'+
                '<div>*用户名: <input v-model="detail_data.cameraUser" type="text"></div>'+
                '<div>*密码: <input v-model="detail_data.cameraPwd" type="text"></div>'+
                '<div>*序列号: <input disabled v-model="detail_data.deviceSerial" type="text"></div>'+
                '<div>*验证码: <input disabled v-model="detail_data.validateCode" type="text"></div>'+
                '<div class="postData"><input @click="alterData" class="save"  type="button" value="保存"><input class="clear" @click="show_detail=false" type="button" value="取消"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '',
                classId: null,
                pageNo: 1,
                pageCount: 1,
                responseData: [],
                show_detail: false,
                detail_data: null,
                add_data: {
                    token: token,
                    gartenId: null,
                    cameraIp: '',
                    cameraPort: '',
                    cameraUser: '',
                    cameraPwd: '',
                    deviceSerial: '',
                    validateCode: '',
                    type: null,
                    pointId: '',
                },
                add_data_vcr: {
                    token: token,
                    gartenId: null,
                    cameraIp: '',
                    cameraPort: '',
                    cameraUser: '',
                    cameraPwd: '',
                    deviceSerial: '',
                    validateCode: '',
                    type: null,
                    pointId: null,
                },
                tableTitle: ['幼儿园','序列号','使用场所','url','隐藏','操作'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/getLiveCameraList.do',
                    data: {
                        token: token,
                        gartenId: kindergartens.id,
                        province: address3.province,
                        city: address3.city,
                        countries: address3.counties,
                        pageNo: self.pageNo,
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.tableItem = self.responseData.map(function (item) {
                            return {
                                gartenName: item.gartenName,
                                deviceSerial: item.deviceSerial,
                                get type(){
                                    switch(item.type){
                                        case 0:
                                            return '教室';
                                        case 1:
                                            return '食堂';
                                        case 2:
                                            return '操场';
                                        case 3:
                                            return '公共教室';
                                    }
                                },
                                url: item.url,
                                operation: {
                                    action: ['查看/修改','删除']
                                }
                            }
                        });
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
            getPageNo: Vue.prototype.$getPageNo,
            showTab: function (e) {
                var txt = e.target.innerText;
                if(txt !== '直播摄像头列表' && txt !== '直播摄像头添加' && txt !== '直播摄像头添加(录像机)') return;
                this.show_current = txt;
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value) {
                    case '查看/修改':
                        this.show_detail = true;
                        kindergartens.id = this.detail_data.gartenId;
                        break;
                    case '删除':
                        confirm('是否确认删除')&&
                        $.ajax({
                            url: baseUrl + '/deleteLiveCamera.do',
                            data: {
                                token: token,
                                cameraId: self.detail_data.cameraId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                $.ajax(self.xhr);
                                alert('删除成功');
                            }
                        });
                        break;
                }
            },
            addData: function (vcr) {
                var self = this,
                    add_data = null,
                    url = '';
                switch(vcr){
                    case 'vcr':
                        add_data = this.add_data_vcr;
                        url = baseUrl + '/addLiveCameraUrl.do';
                        break;
                    default:
                        add_data = this.add_data;
                        url = baseUrl + '/addLiveCamera.do';
                        break;
                }
                add_data.gartenId = kindergartens.id;
                if(add_data.type === 0){
                    add_data.pointId = this.classId;
                }else {
                    delete add_data.pointId;
                }
                for(var k in add_data){
                    if(!add_data[k]){
                        if(k === 'type' && add_data[k] === 0) continue;
                        alert('*为必填项,请填写完整');
                        return;
                    }
                }
                $.ajax({
                    url: url,
                    data: add_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('添加成功');
                            self.show_current = '直播摄像头列表';
                        }else {
                            alert('设备信息(序列号、验证码)填写错误或已添加');
                        }
                    }
                });
            },
            alterData: function () {
                var self = this;
                this.detail_data.token = token;
                this.detail_data.pointId = this.classId;
                delete this.detail_data.img;
                if(this.detail_data.type !== 0){
                    delete this.detail_data.pointId;
                }
                for(var k in this.detail_data){
                    if(!this.detail_data[k]){
                        if(k == 'gartenClass' || k==='type' && this.detail_data[k] === 0) continue;
                        alert('*为必填项,请填写完整');
                        return;
                    }
                }
                $.ajax({
                    url: baseUrl + '/updateLiveCamera.do',
                    data: self.detail_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('修改成功');
                            self.show_detail = false;
                        }else{
                            alert('设备信息(序列号、验证码)填写错误或已添加');
                        }
                    }
                });
            }
        },
        beforeMount: function () {
            this.show_current = '直播摄像头列表';
            $.ajax(this.xhr);
        }
    });
    // 设备管理
    var equipManage = Vue.component('equip-Manage',{
        template:
        '<div class="equipManage">' +
            '<div @click="showTab($event)" class="nav">' +
                '<div :class="{current: show_current == '+"'设备列表'"+'}">设备列表</div>'+
                '<div :class="{current: show_current == '+"'新增设备'"+'}">新增设备</div>'+
            '</div>'+
            '<div v-show="show_current == '+"'设备列表'"+'">' +
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
                '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current == '+"'新增设备'"+'">' +
                '<h3>新增设备</h3>'+
                '<div>*设备名称: <input v-model="add_equip.equipmentName" type="text"></div>'+
                '<div>*设备价格: <input v-model="add_equip.price" type="text"></div>'+
                '<div>备注: <textarea v-model="add_equip.remark"></textarea></div>'+
                '<div>上传图片: <input @change="getImgBase64($event)" type="file"></div>'+
                '<div class="postData">' +
                    '<input @click="addEquip" class="save" type="button" value="保存">' +
                '</div>'+
            '</div>'+
            '<div v-if="show_detail" class="look-Detaildata">' +
                '<h3>查看修改设备</h3>'+
                '<div>*设备名称: <input v-model="detail_data.equipmentName" type="text"></div>'+
                '<div>*设备价格: <input v-model="detail_data.price" type="text"></div>'+
                '<div>备注: <textarea :value="detail_data.remark"></textarea></div>'+
                '<div>设备图片: <input @change="getImgUrlBase64($event)" id="img_file" type="file"><label for="img_file"><img v-show="detail_data.imgUrl || detail_data.img_show" :src="detail_data.img_show || detail_data.imgUrl" alt=""></label></div>'+
                '<div class="postData">' +
                    '<input @click="update_equip" class="save" type="button" value="修改">' +
                    '<input @click="show_detail = null" class="clear" type="button" value="取消">' +
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '设备列表',
                pageCount: 1,
                pageNo: 1,
                responseData: [],
                detail_data: null,
                show_detail: false,
                tableTitle: ['设备名称', '设备价格','隐藏','操作'],
                tableItem: [],
                reader_add: new FileReader(),
                reader_update: new FileReader(),
                add_equip: {
                    token: token,
                    equipmentName: '',
                    price: '',
                    img: '',
                    remark: ''
                },
                mustFill: ['equipmentName','price']
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findEquipmentName.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    equipmentName: item.equipmentName,
                                    price: item.price,
                                    operation: {
                                        action: ['查看/修改','删除']
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
                if(!/^(设备列表|新增设备)$/.test(target)) return;
                this.show_current = target;
            },
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value){
                    case '查看/修改':
                        this.show_detail = true;
                        break;
                    case '删除':
                        confirm('是否确认删除 ' + this.detail_data.equipmentName) &&
                        $.ajax({
                            url: baseUrl + '/deleteEquipmentName.do',
                            data: {
                                token: token,
                                equipmentId: self.detail_data.equipmentId
                            },
                            type: 'post',
                            success: function (data) {
                                switch(data.state){
                                    case 0:
                                        break;
                                        alert('删除失败');
                                    case 1:
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                        break;
                                }
                            }
                        })
                        break;
                }

            },
            getImgBase64: function (e) {
                var file = e.target.files[0];
                if(!this.$isImage(file)) return;
                this.reader_add.readAsDataURL(file);
            },
            getImgUrlBase64: function (e) {
                var file = e.target.files[0];
                if(!this.$isImage(file)) return;
                this.reader_update.readAsDataURL(file);
            },
            addEquip: function () {
                var self = this;
                if(this.$isNotFilled(this.add_equip,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/addEquipmentName.do',
                    data: this.add_equip,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('添加失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                alert('添加成功');
                                self.show_current = '设备列表';
                                break;
                            case 2:
                                alert('设备名重复,添加失败');
                                break;
                        }
                    },error: function () {
                        alert('添加失败');
                    }
                });
            },
            update_equip: function () {
                var self = this;
                this.detail_data.token = token;
                if(this.$isNotFilled(this.add_equip,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/updateEquipmentName.do',
                    data: this.detail_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                alert('修改成功');
                                self.show_detail = false;
                                break;
                            case 2:
                                alert('设备名称重复');
                                break;
                        }
                    }
                });
            }
        },
        created: function () {
            var self = this;
            $.ajax(this.xhr);
            this.reader_add.onload = function () {
                self.add_equip.img = self.$disposeBase64(this.result);
            }
            this.reader_update.onload = function () {

                Vue.set(self.detail_data,'img_show',this.result);
                self.detail_data.img = self.$disposeBase64(this.result);
            }
        }
    });
    // 设备订单处理
    var equipOrder = Vue.component('equip-order',{
        template:
            '<div>' +
                '<div class="nav">'+
                    '<div class="current">设备订单列表</div>'+
                '</div>'+
                '<div>'+
                    '<div class="filter">' +
                        '<select v-model="state">' +
                            '<option :value="null">申请状态</option>'+
                            '<option :value="1">待处理</option>'+
                            '<option :value="2">已发送</option>'+
                            '<option :value="3">拒发送</option>'+
                        '</select>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                    '<div v-if="show_detail" class="look-Detaildata">' +
                        '<h3>设备订单详情: </h3>'+
                        '<div>邮政编码: <input disabled :value="detail_data.postalcode" type="text"></div>'+
                        '<div>详细地址: <input disabled :value="detail_data.address" type="text"></div>'+
                        '<div>手机号: <input disabled :value="detail_data.fromPhonenumber" type="text"></div>'+
                        '<div>总价: <input disabled :value="detail_data.totalPrice" type="text"></div>'+
                        '<h3>申请设备信息:</h3>'+
                        '<public-table :title="tableTitle_equip" :item="tableItem_equip"></public-table>'+
                        '<div class="postData">' +
                            '<input @click="show_detail=false" class="clear" type="button" value="关闭">'+
                        '</div>'+
                    '</div>'+
                    '<div class="look-Detaildata" v-show="dispose.isShow">' +
                        '<h3>订单处理</h3>'+
                        '<div>发送状态: ' +
                            '<select v-model="dispose.state">' +
                                '<option :value="null">发送状态</option>'+
                                '<option :value="2">已发送</option>'+
                                '<option :value="3">拒发送</option>'+
                            '</select>'+
                        '</div>'+
                        '<div>联系方式: <input v-model="dispose.toPhoneNumber" type="text"></div>'+
                        '<div>备注: <textarea v-model="dispose.remark"></textarea></div>'+
                        '<div class="postData">' +
                            '<input @click="disposeData" type="button" value="保存" class="save">'+
                            '<input @click="dispose.isShow=false" type="button" value="取消" class="clear">'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>',
                data: function () {
            return {
                state: null,
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['设备名称','设备总价','申请时间','申请状态','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                show_detail: false,
                tableTitle_equip: ['设备名称','设备单价','申请数量','设备总价'],
                tableItem_equip: [],
                dispose: { //订单处理数据
                    isShow: false,
                    wuliaoId: '',
                    state: null,
                    toPhoneNumber: '',
                    remark: '',
                    token: token,
                }
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/wuliaoOrder.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        state: this.state
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            data.info.list.forEach(function (item,index,arr) {
                                arr[index].equipmentAll = JSON.parse(item.equipmentAll);
                            });
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item) {
                                return  {
                                    equipmentName: item.equipmentAll.map(function (item,index) {
                                        return item.equipmentName;
                                    }).join('、'),
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
                                        action: ['查看','处理'],
                                        get action(){
                                            switch(item.state){
                                                case 1:
                                                    return ['查看','处理'];
                                                default:
                                                    return ['查看'];
                                            }
                                        }
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
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        this.tableItem_equip = this.detail_data.equipmentAll.map(function (item,index) {
                            return {
                                equipmentName: item.equipmentName,
                                unitiPrice: item.unitPrice,
                                count: item.count,
                                price: item.price
                            }
                        });
                        break;
                    case '处理':
                        this.dispose.isShow = true;
                        this.dispose.wuliaoId = this.detail_data.wuliaoId;
                        break;
                }
            },
            disposeData: function () {
                var self = this;
                if(!this.dispose.state){
                    alert('未选择发送状态');
                    return;
                }
                $.ajax({
                    url: baseUrl + '/resolveWuliaoOrder.do',
                    data: this.dispose,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                self.dispose = {
                                    token: token,
                                    isShow: false,
                                    wuliaoId: '',
                                    state: null,
                                    toPhoneNunmber: '',
                                    remark: '',
                                }
                                alert('订单处理成功');
                                $.ajax(self.xhr);
                                break;
                            case 2:
                                alert('订单编号错误');
                                break;
                            case 3:
                                alert('该用户余额不足');
                                break;
                            case 4:
                                alert('该订单已处理');
                                break;
                        }
                    }
                });
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 售后处理
    var afterSales = Vue.component('after-sales',{
        template:
        '<div>' +
            '<div class="nav">' +
                '<div :class="{current: show_current == '+"'售后申请列表'"+'}">售后申请列表</div>'+
            '</div>'+
            '<div>' +
                '<div class="filter">' +
                    '开始日期: <public-date @giveTimes="getTimes('+"$event,'startTime'"+')"></public-date>'+
                    '结束日期: <public-date @giveTimes="getTimes('+"$event,'endTime'"+')"></public-date>'+
                    '<div>' +
                        '<public-address3></public-address3>'+
                        '<public-agents></public-agents>'+
                        '<public-kindergartens></public-kindergartens>'+
                        '是否回复: ' +
                        '<select v-model="state">' +
                            '<option :value="null">请选择</option>'+
                            '<option :value="0">未回复</option>'+
                            '<option :value="1">已回复</option>'+
                        '</select>'+
                    '</div>'+
                '</div>'+
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
                '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '<div v-if="show_reply" class="look-Detaildata">' +
                    '<h3>售后回复</h3>'+
                    '<div>代理商: <input disabled :value="detail_data.agent.agentName" type="text"></div>'+
                    '<div>幼儿园: <input disabled :value="detail_data.garten? detail_data.garten.gartenName : null" type="text"></div>'+
                    '<div>标题: <input disabled :value="detail_data.title" type="text"></div>'+
                    '<div>内容: <textarea disabled :value="detail_data.content" type="text"></textarea></div>'+
                    '<div>备注: <input disabled :value="detail_data.mark" type="text"></div>'+
                    '<div>请输入回复内容: <textarea v-model="reply_data.reply"></textarea></div>'+
                    '<div class="postData"><input @click="reply" class="save" type="button" value="确定"></div>'+
                '</div>'+
            '</div>'+
            '<div class="look-Detaildata" v-if="show_detail">' +
                '<h3>售后申请信息: </h3>'+
                '<div>代理商: <input disabled :value="detail_data.agent.agentName" type="text"></div>'+
                '<div>幼儿园: <input disabled :value="detail_data.garten? detail_data.garten.gartenName : null" type="text"></div>'+
                '<div>标题: <input disabled :value="detail_data.title" type="text"></div>'+
                '<div>内容: <textarea disabled :value="detail_data.content"></textarea></div>'+
                '<div>备注: <input disabled :value="detail_data.mark" type="text"></div>'+
                '<div>申请日期: <input disabled :value="$formatDate(detail_data.saleServiceId/1000)" type="text"></div>'+
                '<div>回复状态: <input disabled :value="detail_data.state == 0? '+"'未回复':'已回复'"+'" type="text"></div>'+
                '<div v-if="detail_data.state">回复日期: <input disabled :value="$formatDate(detail_data.replyTime/1000)" type="text"></div>'+
                '<div v-if="detail_data.state">回复内容: <textarea disabled :value="detail_data.reply"></textarea></div>'+
                '<div class="postData">'+
                    '<input type="button" @click="show_detail = false" class="clear" value="关闭">'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '售后申请列表',
                show_detail: false,
                show_reply: false,
                startTime: 0,
                endTime: 0,
                state: null,
                pageCount: 1,
                pageNo: 1,
                reply_data: {
                    token: token,
                    saleServiceId: null,
                    reply: '',
                },
                tableTitle: ['代理商', '幼儿园', '标题', '内容','申请时间','回复状态', '隐藏', '操作'],
                tableItem: [],
                responseData: [],
                detail_data: null
            };
        },
        computed: {
            xhr: function () {
                var self = this;
                var self = this;
                return {
                    url: baseUrl + '/findSaleService.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        agentIds: agents.ids,
                        start: this.startTime,
                        end: this.endTime,
                        state: this.state,
                        gartenIds: kindergartens.ids,
                    },
                    type: 'post',
                    traditional: true,
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    agentName: item.agent.agentName,
                                    get gartenName(){
                                        if(item.garten){
                                            return item.garten.gartenName;
                                        }else {
                                            return '';
                                        }  
                                    },
                                    title: item.title,
                                    content: item.content,
                                    applyTime: self.$formatDate(item.saleServiceId/1000),
                                    state: item.state == 0 ? '未回复': '已回复',
                                    operation: {
                                        get action(){
                                            if(item.state){
                                                return ['查看','删除']
                                            }else {
                                                return ['查看','回复','删除']
                                            }
                                        }
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
            getPageNo: Vue.prototype.$getPageNo,
            getTimes: Vue.prototype.$getTimes,
            getOperation: function (index, value) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                    case '回复':
                        this.show_reply = true;
                        break;
                    case '删除':
                        confirm('是否删除售后订单') &&
                            $.ajax({
                                url: baseUrl + '/deleteSaleService.do',
                                data: {
                                    token: token,
                                    saleServiceId: this.detail_data.saleServiceId
                                },
                                type: 'post',
                                success: function (data) {
                                    switch(data.state){
                                        case 1:
                                            $.ajax(self.xhr);
                                            alert('删除成功')
                                            break;
                                        default:
                                            alert('删除失败');
                                            break;
                                    }
                                }
                            })
                        break;
                }

            },
            reply: function () {
                var self = this;
                this.reply_data.saleServiceId = this.detail_data.saleServiceId;
                $.ajax({
                    url: baseUrl + '/replySaleService.do',
                    data: this.reply_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state == 1){
                            $.ajax(self.xhr);
                            alert('已将信息回复给代理商');
                            self.show_reply = false;
                        }else {
                            alert('参数错误');
                        }
                    }
                });
            }
        }
    });
    // 订单查看（只有视频和考勤）
    var orderLook = Vue.component('order-look',{
        template:
        '<div class="orderLook">' +
            '<div class="filter">' +
                '<public-address3></public-address3>'+
                '<public-kindergartens></public-kindergartens>'+
                '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                '<div>' +
                    '付款人: <input v-model="name" type="text">'+
                    '手机号: <input v-model="phoneNumber" type="text">'+
                    '宝宝姓名: <input v-model="babyName" type="text">'+
                    '订单状态: ' +
                    '<select v-model="state">' +
                        '<option :value="null">请选择</option>'+
                        '<option :value="1">已支付</option>'+
                        '<option :value="0">未支付</option>'+
                    '</select>'+
                    '类型: ' +
                    '<select v-model="type">' +
                        '<option :value="null">请选择</option>'+
                        '<option :value="2">全园视频</option>'+
                        '<option :value="3">全园考勤</option>'+
                        '<option :value="4">家长视频</option>'+
                        '<option :value="5">家长考勤</option>'+
                        '<option :value="6">全园视频+考勤</option>'+
                        '<option :value="7">家长视频+考勤</option>'+
                        '<option :value="8">总控制端帮家长买视频</option>'+
                        '<option :value="9">总控制端帮家长买考勤</option>'+
                        '<option :value="11">总控制端帮家长买视频+考勤</option>'+
                        '<option :value="12">总控制端帮全园买视频</option>'+
                        '<option :value="13">总控制端帮全园买考勤</option>'+
                        '<option :value="16">总控制端帮全园买视频+考勤</option>'+
                    '</select>'+
                    '<div class="btn-skyblue" @click="exportOrder">导出订单</div>'+
                '</div>'+
            '</div>'+
            '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
        '</div>',
        data:function () {
            return {
                startTime: 0,
                endTime: 0,
                name: '',
                phoneNumber: '',
                babyName: '',
                state:null,
                type: null,
                pageCount:1,
                pageNo:1,
                tableTitle:['付款人(或操作人)','手机号','宝宝姓名','订单类型','开通时长(月)','订单编号','下单时间','订单状态','支付方式','订单金额'],
                tableItem:[]
            }
        },
        computed:{
            filter_data: function () {
                return {
                    token: token,
                    pageNo: this.pageNo,
                    province: address3.province,
                    city: address3.city,
                    countries: address3.counties,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    gartenId: kindergartens.id,
                    state: this.state,
                    name: this.name,
                    phoneNumber: this.phoneNumber,
                    babyName: this.babyName,
                    type: this.type
                }
            },
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/order.do',
                    data: this.filter_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.pageCount;
                        self.tableItem = data.info.map(function (item,index) {
                            return {
                                get name(){
                                    if(item.employeeName){
                                        return item.employeeName;
                                    }else {
                                        return item.name;
                                    }
                                },
                                phoneNumber: item.phoneNumber,
                                babyName: item.babyName,
                                get type(){
                                    switch(item.type){
                                        case 2:
                                            return '全园视频';
                                        case 3:
                                            return '全园考勤';
                                        case 4:
                                            return '家长视频';
                                        case 5:
                                            return '家长考勤';
                                        case 6:
                                            return '全园视频+考勤';
                                        case 7:
                                            return '家长视频+考勤';
                                        case 8:
                                            return '总控制端帮家长买视频';
                                        case 9:
                                            return '总控制端帮家长买考勤';
                                        case 11:
                                            return '总控制端帮家长买视频+考勤';
                                        case 12:
                                            return '总控制端帮全园买视频';
                                        case 13:
                                            return '总控制端帮全园买考勤';
                                        case 16:
                                            return '总控制端帮全园买视频+考勤';
                                    }
                                },
                                monthCount: item.monthCount,
                                orderNumber: item.orderNumber,
                                time: self.$formatDate(item.orderTime,true),
                                state: item.state === 0 ? '未支付':'已支付',
                                payeType: item.payType === 0 ? '支付宝': '微信',
                                money: item.orderMoney
                            };
                        });
                    }
                }
            }
        },
        watch: {
            filter_data: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
            exportOrder: function () {
                $.ajax({
                    url: baseUrl + '/exportOrder.do',
                    data: this.filter_data,
                    type: 'post',
                    success: function () {
                        window.location.href = this.url + '?' + this.data;
                    },
                    error: function () {
                    }
                });
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        },
    });
    // 用户反馈
    var userFeedback = Vue.component('user-feedback',{
        template:
        '<div>' +
            '<div class="nav">' +
                '<div class="current">用户反馈列表</div>'+
            '</div>'+
            '<div>' +
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="show_detail">' +
                    '<h3>用户反馈信息</h3>'+
                    '<div>幼儿园: <input disabled :value="detail_data.gartenName" type="text"></div>'+
                    '<div>身份: <input disabled :value="detail_data.job" type="text"></div>'+
                    '<div>姓名: <input disabled :value="detail_data.name" type="text"></div>'+
                    '<div>手机号: <input disabled :value="detail_data.phoneNumber" type="text"></div>'+
                    '<div>反馈日期: <input disabled :value="$formatDate(detail_data.time)" type="text"></div>'+
                    '<div>反馈内容: <textarea disabled :value="detail_data.content"></textarea></div>'+
                    '<div class="postData"><input @click="show_detail=false" class="clear" type="button" value="关闭"></div>'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
          return {
              show_detail: false,
              pageNo: 1,
              pageCount: 1,
              tableTitle: ['幼儿园','身份','姓名','手机号','反馈日期','反馈内容','隐藏','操作'],
              tableItem: [],
              responseData: [],
              detail_data: null,
          }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/feedback.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            var tableItem = [];
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.responseData.forEach(function (item,index) {
                                 var feedback = {
                                     gartenName: item.gartenName,
                                     job: item.job,
                                     name: item.name,
                                     phoneNumber: item.phoneNumber,
                                     time: self.$formatDate(item.time),
                                     content: item.content,
                                     operation: {
                                         action: ['查看']
                                     }
                                 }
                                tableItem[index] = feedback;
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
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                }
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 员工管理
    var staffManage = Vue.component('staff-manage',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'员工列表'"+'}">员工列表</div>'+
                    '<div :class="{current: show_current == '+"'员工添加'"+'}">员工添加</div>'+
                '</div>'+
                '<div v-show="show_current == '+"'员工列表'"+'">' +
                    '<div class="filter">' +
                        '<public-departments @giveDepartmentNo="$getDepartmentNo($event)"></public-departments>'+
                        '<public-jobs @giveJobNo="$getJobNo($event)"></public-jobs>'+
                        '员工姓名: <input v-model="name" type="text">'+
                        '员工手机: <input v-model="phoneNumber" type="text">'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                    '<div class="look-Detaildata" v-if="show_detail">' +
                        '<h3>员工查看/修改</h3>'+
                        '<div>部门: <public-departments :id="detail_data.departmentNo" @giveDepartmentNo="getDepartmentNo('+"'detail_data',$event"+')"></public-departments></div>'+
                        '<div>职位: <public-jobs :id="detail_data.jobsNo" @giveJobNo="getJobNo('+"'detail_data',$event"+')"></public-jobs></div>'+
                        '<div>代理区域(销售人员填写): <public-address3></public-address3></div>'+
                        '<div>姓名: <input v-model="detail_data.name" type="text"></div>'+
                        '<div>性别: ' +
                        '<select v-model="detail_data.sex">' +
                        '<option :value="0">男</option>'+
                        '<option :value="1">女</option>'+
                        '</select>'+
                        '</div>'+
                        '<div>入职时间: <public-date :date="detail_data.entryTime" @giveTimes="getTimes('+"'detail_data',$event"+')"></public-date></div>'+
                        '<div>手机号: <input v-model="detail_data.phoneNumber" type="text"></div>'+
                        '<div>密码: <input v-model="detail_data.pwd" type="text"></div>'+
                        '<div><public-permission :pms="detail_data.permission" @givePermission="getPermission('+"'detail_data',$event"+')"></public-permission></div>'+
                        '<div class="postData">' +
                        '<input @click="updateStaff" type="button" value="修改" class="save">' +
                        '<input @click="show_detail = false" type="button" value="取消" class="clear">' +
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="add-Newdata" v-show="show_current == '+"'员工添加'"+'">' +
                    '<h3>员工添加</h3>'+
                    '<div>部门: <public-departments @giveDepartmentNo="getDepartmentNo('+"'staff_add',$event"+')"></public-departments></div>'+
                    '<div>职位: <public-jobs @giveJobNo="getJobNo('+"'staff_add',$event"+')"></public-jobs></div>'+
                    '<div v-if="/^(销售部|销售部门)$/.test(staff_add.departmentName)">代理区域: <public-address3></public-address3></div>'+
                    '<div>姓名: <input v-model="staff_add.name" type="text"></div>'+
                    '<div>性别: ' +
                        '<select v-model="staff_add.sex">' +
                            '<option :value="0">男</option>'+
                            '<option :value="1">女</option>'+
                        '</select>'+
                    '</div>'+
                    '<div>入职时间: <public-date @giveTimes="getTimes('+"'staff_add',$event"+')"></public-date></div>'+
                    '<div>手机号: <input v-model="staff_add.phoneNumber" type="text"></div>'+
                    '<div>密码: <input v-model="staff_add.pwd" type="text"></div>'+
                    '<div><public-permission @givePermission="getPermission('+"'staff_add',$event"+')"></public-permission></div>'+
                    '<div class="postData"><input @click="staffAdd" type="button" value="保存" class="save"></div>'+
                '</div>'+
            '</div>',
                data: function () {
            return {
                departmentNo: null,
                name: '',
                employeeNo: '',
                jobsNo: null,
                phoneNumber: '',
                show_current: '员工列表',
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['员工姓名','性别','手机号','入职时间','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                show_detail: false,
                staff_add: {
                    token: token,
                    departmentName: '',
                    sex: 0,
                },
                mustFill: ['departmentNo','jobsNo','name','phoneNumber','pwd']
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findEmployee.do',
                    data: {
                        token: token,
                        departmentNo: this.departmentNo,
                        name: this.name,
                        jobsNo: this.jobsNo,
                        phoneNumber: this.phoneNumber,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    name: item.name,
                                    sex: item.sex == 0? '男' : '女',
                                    phoneNumber: item.phoneNumber,
                                    entryTime: self.$formatDate(item.entryTime),
                                    operation: {
                                        action: ['查看/修改','删除']
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
                if(/^(员工列表|员工添加)$/.test(target)){
                    this.show_current = target;
                }
            },
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                var detail = this.detail_data;
                switch(value){
                    case '查看/修改':
                        this.show_detail = true;
                            address3.current_province = detail.province || '省份';
                            address3.current_city = detail.city || '城市';
                            address3.current_counties = detail.countries || '县区';
                        break;
                    case '删除':
                        confirm('是否删除员工') &&
                            $.ajax({
                                url: baseUrl + '/deleteEmployee.do',
                                data: {
                                    token: token,
                                    employeeNo: detail.employeeNo
                                },
                                type: 'post',
                                success: function (data) {
                                    switch (data.state){
                                        case 1:
                                            $.ajax(self.xhr);
                                            alert('删除成功');
                                            break;
                                        case 3:
                                            alert('存在幼儿园的代理商是这个员工,无法删除');
                                            break;
                                    }
                                }
                            })
                        break;
                }
            },
            getDepartmentNo: function (prop,$event) {
                this[prop].departmentNo = $event[0];
                this[prop].departmentName = $event[1];
            },
            getJobNo: function (prop,$event) {
                this[prop].jobsNo = $event[0];
            },
            getTimes: function (prop,timestamp) {
                this[prop].entryTime = timestamp;
            },
            getPermission: function (prop,pms) {
                this[prop].permission = pms;
            },
            staffAdd: function () {
                var self = this;
                if(/^(销售部|销售部门)$/.test(this.staff_add.departmentName)){
                    this.staff_add.province = address3.province;
                    this.staff_add.city = address3.city;
                    this.staff_add.countries = address3.counties;
                }
                if(this.$isNotFilled(this.staff_add,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/addEmployee.do',
                    data: this.staff_add,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                alert('注册成功');
                                self.show_current = '员工列表'
                                break;
                            case 2:
                                alert('该手机号已注册');
                                break;
                        }
                    }
                });
            },
            updateStaff: function () {
                var self = this;
                this.detail_data.province = address3.province;
                this.detail_data.city = address3.city;
                this.detail_data.countries = address3.counties;
                this.detail_data.token = token;
                if(this.$isNotFilled(this.detail_data,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/updateEmployee.do',
                    data: this.detail_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                self.show_detail = false;
                                alert('修改成功');
                                break;
                            case 2:
                                alert('该手机号已注册');
                                break;
                        }
                    }
                });
            }

        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 部门管理
    var departmentManage = Vue.component('department-manage',{
        template:
        '<div>' +
            '<div @click="showTab($event)" class="nav">' +
                '<div :class="{current: show_current == '+"'部门列表'"+'}">部门列表</div>'+
                '<div :class="{current: show_current == '+"'部门添加'"+'}">部门添加</div>'+
            '</div>'+
            '<div v-show="show_current=='+"'部门列表'"+'">' +
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
            '</div>'+
            '<div class="add-Newdata" v-show="show_current=='+"'部门添加'"+'">' +
                '<h3>部门添加</h3>'+
                '<div>部门名称: <input v-model="add_department.departmentName" type="text"></div>'+
                '<div>备注: <textarea v-model="add_department.mark"></textarea></div>'+
                '<div class="postData"><input @click="addDepartment" type="button" value="保存" class="save"></div>'+
            '</div>'+
                '<div class="look-Detaildata" v-if="show_detail">' +
                '<h3>部门信息</h3>'+
                '<div>部门名称: <input disabled :value="detail_data.departmentName" type="text"></div>'+
                '<div>备注: <textarea disabled :value="detail_data.mark"></textarea></div>'+
                '<div class="postData"><input @click="show_detail=false" type="button" value="关闭" class="clear"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '部门列表',
                show_detail: false,
                add_department: {
                    token: token,
                    departmentName: '',
                    mark: '',
                },
                tableTitle: ['部门名称','创建日期','备注','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findDepartment.do',
                    success: function (data) {
                        if(data.state){
                            var tableItem = [];
                            self.responseData = data.info;
                            self.responseData.forEach(function (item,index) {
                                var department = {
                                    departmentName: item.departmentName,
                                    registTime: self.$formatDate(item.departmentNo),
                                    mark: item.mark,
                                    operation: {
                                        action: ['查看','删除']
                                    }
                                }
                                tableItem[index] = department;
                            });
                            self.tableItem = tableItem;
                        }
                    }
                }
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(部门列表|部门添加)$/.test(target)){
                    this.show_current = target;
                }
            },
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '删除':
                        confirm('是否确认删除') &&
                        $.ajax({
                            url: baseUrl + '/deleteDepartment.do',
                            data: {
                                token: token,
                                departmentNo: this.detail_data.departmentNo
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    $.ajax(self.xhr);
                                    alert('删除成功');
                                }
                            }
                        });
                        break;
                    case '查看':
                        this.show_detail = true;
                        break;

                }
            },
            addDepartment: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/addDepartment.do',
                    data: this.add_department,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                alert('添加成功');
                                self.show_current = '部门列表';
                                break;
                            case 4:
                                alert('该部门已被注册');
                                break;
                        }
                    },error: function () {
                    }
                });
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 职位管理
    var jobManage = Vue.component('job-manage',{
        template:
        '<div>' +
            '<div @click="showTab($event)" class="nav">' +
                '<div :class="{current: show_current == '+"'职位列表'"+'}">职位列表</div>'+
                '<div :class="{current: show_current == '+"'职位添加'"+'}">职位添加</div>'+
            '</div>'+
            '<div v-show="show_current=='+"'职位列表'"+'">' +
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
            '</div>'+
            '<div class="add-Newdata" v-show="show_current=='+"'职位添加'"+'">' +
                '<h3>职位添加</h3>'+
                '<div>职位名称: <input v-model="add_job.jobsName" type="text"></div>'+
                '<div>备注: <textarea v-model="add_job.mark"></textarea></div>'+
                '<div class="postData"><input @click="addJob" type="button" value="保存" class="save"></div>'+
            '</div>'+
            '<div class="look-Detaildata" v-if="show_detail">' +
                '<h3>职位信息</h3>'+
                '<div>职位名称: <input disabled :value="detail_data.jobsName" type="text"></div>'+
                '<div>备注: <textarea disabled :value="detail_data.mark"></textarea></div>'+
                '<div class="postData"><input @click="show_detail=false" type="button" value="关闭" class="clear"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '职位列表',
                show_detail: false,
                add_job: {
                    token: token,
                    jobsName: '',
                    mark: '',
                },
                tableTitle: ['职位名称','创建日期','备注','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findJobs.do',
                    success: function (data) {
                        if(data.state){
                            var tableItem = [];
                            self.responseData = data.info;
                            self.responseData.forEach(function (item,index) {
                                var department = {
                                    jobsName: item.jobsName,
                                    registTime: self.$formatDate(item.jobsNo),
                                    mark: item.mark,
                                    operation: {
                                        action: ['查看','删除']
                                    }
                                }
                                tableItem[index] = department;
                            });
                            self.tableItem = tableItem;
                        }
                    }
                }
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(职位列表|职位添加)$/.test(target)){
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
                        break;
                    case '删除':
                        confirm('是否确认删除') &&
                        $.ajax({
                            url: baseUrl + '/deleteJobs.do',
                            data: {
                                token: token,
                                jobsNo: this.detail_data.jobsNo
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    $.ajax(self.xhr);
                                    alert('删除成功');
                                }
                            }
                        });
                        break;

                }
            },
            addJob: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/addJobs.do',
                    data: this.add_job,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                $.ajax(self.xhr);
                                alert('添加成功');
                                self.show_current = '职位列表';
                                break;
                            case 4:
                                alert('该职位已被注册');
                                break;
                        }
                    }
                });
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 添加报表
    var addReport = Vue.component('add-report',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'个人报表'"+'}">个人报表</div>'+
                    '<div :class="{current: show_current == '+"'添加报表'"+'}">添加报表</div>'+
                '</div>'+
                '<div v-show="show_current=='+"'添加报表'"+'" class="add-Newdata">' +
                    '<div>报表类型: ' +
                        '<select v-model="add_data.type">' +
                            '<option :value="1">日</option>'+
                            '<option :value="2">周</option>'+
                            '<option :value="3">月</option>'+
                        '</select>'+
                    '</div>'+
                    '<div>开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date></div>'+
                    '<div>结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date></div>'+
                    '<div>协调内容: <textarea v-model="add_data.harmonizeContent"></textarea></div>'+
                    '<div>工作内容: <textarea v-model="add_data.workContent"></textarea></div>'+
                    '<div>工作总结: <textarea v-model="add_data.workSummary"></textarea></div>'+
                    '<div>今后计划: <textarea v-model="add_data.plan"></textarea></div>'+
                    '<div class="postData"><input @click="addData" type="button" value="" class="save" value="保存"></div>'+
                '</div>'+
                '<div v-show="show_current=='+"'个人报表'"+'">' +
                    '<div class="filter">' +
                        '<select v-model="type">' +
                            '<option :value="null">报表类型</option>'+
                            '<option value="1">日</option>'+
                            '<option value="2">周</option>'+
                            '<option value="3">月</option>'+
                        '</select>'+
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                    '<div v-if="show_detail" class="look-Detaildata">' +
                        '<h3>报表详情</h3>'+
                        '<div>报表类型: ' +
                        '<select disabled :value="detail_data.type">' +
                            '<option :value="1">日</option>'+
                            '<option :value="2">周</option>'+
                            '<option :value="3">月</option>'+
                        '</select>'+
                        '</div>'+
                        '<div>开始日期: <input disabled :value="$formatDate(detail_data.startTime)" type="text"></div>'+
                        '<div>结束日期: <input disabled :value="$formatDate(detail_data.endTime)" type="text"></div>'+
                        '<div>协调内容: <textarea disabled :value="detail_data.harmonizeContent"></textarea></div>'+
                        '<div>工作内容: <textarea disabled :value="detail_data.workContent"></textarea></div>'+
                        '<div>工作总结: <textarea disabled :value="detail_data.workSummary"></textarea></div>'+
                        '<div>今后计划: <textarea disabled :value="detail_data.plan"></textarea></div>'+
                        '<div class="postData"><input @click="show_detail = false" type="button" value="关闭" class="clear"></div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                tableTitle: ['报表类型','工作内容','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                pageNo: 1,
                pageCount: 1,
                startTime: 0,
                endTime: 0,
                type: null,
                show_current: '个人报表',
                show_detail: false,
                add_data: {
                    token: token,
                    harmonizeContent: '',
                    startTime: '',
                    endTime: '',
                    workContent: '',
                    workSummary: '',
                    plan: '',
                    type: 2,
                }
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findMyReport.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        type: this.type
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem =  self.responseData.map(function (item,index) {
                                return {
                                    get type(){
                                        switch(item.type){
                                            case 1:
                                                return '日';
                                            case 2:
                                                return '周';
                                            case 3:
                                                return '月'
                                        }
                                    },
                                    workContent: item.workContent,
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
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(个人报表|添加报表)$/.test(target)){
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
                        break;
                    case '删除':
                        confirm('是否确认删除') &&
                        $.ajax({
                            url: baseUrl + '/deleteReport.do',
                            data: {
                                token: token,
                                reportId: this.detail_data.reportId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    $.ajax(self.xhr);
                                    alert('删除成功');
                                }else {
                                    alert('删除失败');
                                }
                            }
                        });
                        break;
                }
            },
            addData: function () {
                var self = this;
                this.add_data.startTime = this.startTime;
                this.add_data.endTime = this.endTime;
                $.ajax({
                    url: baseUrl + '/addReport.do',
                    data: this.add_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            self.show_current = '个人报表';
                            alert('添加报表成功');
                        }
                    }
                })
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 全员报表
    var totalReport = Vue.component('total-report',{
        template:
            '<div>' +
                '<div class="nav">' +
                    '<div class="current">全员报表</div>'+
                '</div>'+
                '<div>' +
                    '<div class="filter">' +
                        '<public-departments @giveDepartmentNo="$getDepartmentNo($event)"></public-departments>'+
                        '<select v-model="type">' +
                            '<option :value="null">报表类型</option>'+
                            '<option value="1">日</option>'+
                            '<option value="2">周</option>'+
                            '<option value="3">月</option>'+
                        '</select>'+
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                    '<div v-if="show_detail" class="look-Detaildata">' +
                        '<h3>报表详情</h3>'+
                        '<div>报表类型: ' +
                        '<select disabled :value="detail_data.type">' +
                            '<option :value="1">日</option>'+
                            '<option :value="2">周</option>'+
                            '<option :value="3">月</option>'+
                        '</select>'+
                        '</div>'+
                        '<div>员工姓名: <input disabled :value="detail_data.name" type="text"></div>'+
                        '<div>开始日期: <input disabled :value="$formatDate(detail_data.startTime)" type="text"></div>'+
                        '<div>结束日期: <input disabled :value="$formatDate(detail_data.endTime)" type="text"></div>'+
                        '<div>协调内容: <textarea disabled :value="detail_data.harmonizeContent"></textarea></div>'+
                        '<div>工作内容: <textarea disabled :value="detail_data.workContent"></textarea></div>'+
                        '<div>工作总结: <textarea disabled :value="detail_data.workSummary"></textarea></div>'+
                        '<div>今后计划: <textarea disabled :value="detail_data.plan"></textarea></div>'+
                        '<div class="postData"><input @click="show_detail = false" type="button" value="关闭" class="clear"></div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                tableTitle: ['报表类型','员工姓名','工作内容','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                pageNo: 1,
                pageCount: 1,
                startTime: 0,
                endTime: 0,
                type: null,
                departmentNo: null,
                show_detail: false
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findReport.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        departmentNo: this.departmentNo,
                        type: this.type
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem =  self.responseData.map(function (item,index) {
                                return {
                                    get type(){
                                        switch(item.type){
                                            case 1:
                                                return '日';
                                            case 2:
                                                return '周';
                                            case 3:
                                                return '月'
                                        }
                                    },
                                    name: item.name,
                                    workContent: item.workContent,
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
            }
        },
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
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
                                url: baseUrl + '/deleteReport.do',
                                data: {
                                    token: token,
                                    reportId: this.detail_data.reportId
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                    }else {
                                        alert('删除失败');
                                    }
                                }
                            });
                        break;
                }
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 部门报表
    var departmentReport = Vue.component('department-report',{
        template:
            '<div>' +
                '<div class="nav">' +
                    '<div class="current">部门报表</div>'+
                '</div>'+
                '<div>' +
                    '<div class="filter">' +
                        '<select v-model="type">' +
                            '<option :value="null">报表类型</option>'+
                            '<option value="1">日</option>'+
                            '<option value="2">周</option>'+
                            '<option value="3">月</option>'+
                        '</select>'+
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                    '<div v-if="show_detail" class="look-Detaildata">' +
                        '<h3>报表详情</h3>'+
                        '<div>报表类型: ' +
                        '<select disabled :value="detail_data.type">' +
                            '<option :value="1">日</option>'+
                            '<option :value="2">周</option>'+
                            '<option :value="3">月</option>'+
                        '</select>'+
                        '</div>'+
                        '<div>员工姓名: <input disabled :value="detail_data.name" type="text"></div>'+
                        '<div>开始日期: <input disabled :value="$formatDate(detail_data.startTime)" type="text"></div>'+
                        '<div>结束日期: <input disabled :value="$formatDate(detail_data.endTime)" type="text"></div>'+
                        '<div>协调内容: <textarea disabled :value="detail_data.harmonizeContent"></textarea></div>'+
                        '<div>工作内容: <textarea disabled :value="detail_data.workContent"></textarea></div>'+
                        '<div>工作总结: <textarea disabled :value="detail_data.workSummary"></textarea></div>'+
                        '<div>今后计划: <textarea disabled :value="detail_data.plan"></textarea></div>'+
                        '<div class="postData"><input @click="show_detail = false" type="button" value="关闭" class="clear"></div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                tableTitle: ['报表类型','员工姓名','工作内容','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                pageNo: 1,
                pageCount: 1,
                startTime: 0,
                endTime: 0,
                type: null,
                show_detail: false
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findDepartmentReport.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        type: this.type
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem =  self.responseData.map(function (item,index) {
                                return {
                                    get type(){
                                        switch(item.type){
                                            case 1:
                                                return '日';
                                            case 2:
                                                return '周';
                                            case 3:
                                                return '月'
                                        }
                                    },
                                    name: item.name,
                                    workContent: item.workContent,
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
            }
        },
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
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
                                url: baseUrl + '/deleteReport.do',
                                data: {
                                    token: token,
                                    reportId: this.detail_data.reportId
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                    }else {
                                        alert('删除失败');
                                    }
                                }
                            });
                        break;
                }
            }
        },
        created: function () {
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
                    '<div>幼儿园类型: <public-gartenType disabled @giveGartenType="getGartenType($event,'+"'apply_detail'"+')" :gartenType="apply_detail.gartenType"></public-gartenType></div>'+
                    '<div>联系人: <input disabled :value="apply_detail.name" type="text" ></div>'+
                    '<div>联系方式: <input disabled :value="apply_detail.phoneNumber" type="text" ></div>'+
                    '<div>合同编号: <input :value="apply_detail.contractNumber" type="text" disabled></div>'+
                    '<div>省市区: <public-address3 :disable="true"></public-address3></div>'+
                    '<div>开园费用: <input :value="apply_detail.money1" type="text" disabled></div>'+
                    '<div>使用设备: <input :value="apply_detail.equipment" type="text" disabled></div>'+
                    '<div>教职工人数: <input :value="apply_detail.workerCount" type="text" disabled></div>'+
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
                '<div>*省市区: <public-address3></public-address3></div>'+
                '<div>开园费用: <input v-model="applyData.money1" type="text" ></div>'+
                '<div>使用设备: <input v-model="applyData.equipment" type="text" ></div>'+
                '<div>教职工人数: <input v-model="applyData.workerCount" type="text" ></div>'+
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
                    tableTitle: ['幼儿园名称', '合同编号', '使用设备', '开园费用', '申请日期', '申请状态', '隐藏', '操作'],
                    tableItem: []
                }
            };
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findMyApplyGarten.do',
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
                                registTime: item.registTime,
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
                            url: url + '/agent/cancelApply.do',
                            data:{
                                token: token,
                                resource: 0,
                                auditId: this.apply_detail.auditId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1) return;
                                $.ajax(self.xhr);
                                alert('取消成功');
                            },
                            error: function () {
                            }
                        });
                }
            },
            getGartenType: function (e,key) {
                this[key].gartenType = e[0];
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
                            case 4:
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
    // 设备申请
    var equipApply = Vue.component('equip-apply',{
        template:
        '<div class="equipApply">' +
            '<div @click="showTab($event)" class="nav">' +
                '<div :class="{current: show_current == '+"'设备申请'"+'}">设备申请</div>'+
                '<div :class="{current: show_current == '+"'个人申请设备列表'"+'}">个人申请设备列表</div>'+
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
                    // '<div class="totalPrice">总价: <span v-text="cartList.totalPrice"></span></div>'+
                    '<div class="buy" @click="cartList.show_orderInfo = true">去申请</div>'+
                '</div>'+
                '<div v-if="cartList.show_orderInfo" class="cart-order add-Newdata">' +
                    '<div>邮政编码: <input v-model="cartList.orderInfo.postalcode" type="text"></div>'+
                    '<div>详细地址: <input v-model="cartList.orderInfo.address" type="text"></div>'+
                    '<div>员工手机号: <input v-model="cartList.orderInfo.fromPhoneNumber" type="text"></div>'+
                    '<div class="postData">' +
                    '<input @click="orderPay" type="button" class="save" value="申请设备">' +
                    '<input @click="cartList.show_orderInfo = false" type="button" class="clear" value="取消">' +
                    '</div>'+
                '</div>'+
            '</div>'+
            '<div class="applyList" v-show="show_current == '+"'个人申请设备列表'"+'">' +
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
                    url: baseUrl + '/findEquipmentName.do',
                    data: {
                        token: token,
                        pageNo: this.equipList.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            var tableItem = [];
                            self.equipList.pageCount = data.info.pageCount;
                            self.equipList.responseData = data.info.list;
                            self.equipList.responseData.forEach(function ( item, index ) {
                                var equipment = {
                                    equipmentName: item.equipmentName,
                                    price: item.price,
                                    operation: {
                                        action: ['查看','添加至购物车']
                                    }
                                }
                                tableItem[index] = equipment;
                            });
                            self.equipList.tableItem = tableItem;
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
                                    }).join('、'),
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
                if(!/^(设备申请|个人申请设备列表|购物车)$/.test(target)) return;
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
                            $.ajax(self.xhr_applyList);
                            alert('申请成功,请等待后台审核');
                            self.cartList.show_orderInfo = false;
                            self.show_current = '个人申请设备列表';
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
    // 部门设备
    var departmentEquip = Vue.component('department-equip',{
        template:
        '<div class="equipApply">' +
            '<div @click="showTab($event)" class="nav">' +
                '<div class="current">部门设备申请列表</div>'+
            '</div>'+
            '<div class="applyList" v-show="show_current == '+"'部门设备申请列表'"+'">' +
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
                show_current: '部门设备申请列表',
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
            }
        },
        computed: {
            xhr_applyList: function () {
                var self = this;
                return {
                    url: baseUrl + '/departmentWuliaoOrder.do',
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
                                        return item.equipmentName;
                                    }).join('、'),
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
            xhr_applyList: function () {
                $.ajax(this.xhr_applyList);
            },
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(!/^(部门设备申请列表)$/.test(target)) return;
                this.show_current = target;
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
            $.ajax(this.xhr_applyList);
        }
    });
    // 添加活动
    var addActivity = Vue.component('activity-manage',{
        template:
        '<div>' +
            '<div @click="showTab($event)" class="nav">' +
                '<div class="current">添加活动</div>'+
            '</div>'+
            '<div class="add-Newdata">' +
                '<h3>添加活动</h3>'+
                '<div>活动标题: <input v-model="add_activity.title" type="text"></div>'+
                '<div>活动内容: <textarea v-model="add_activity.content"></textarea></div>'+
                '<div>活动原因: <textarea v-model="add_activity.reason"></textarea></div>'+
                '<div class="postData"><input @click="addActivity" class="save" type="button" value="保存"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                add_activity:{
                    token: token,
                    title: '',
                    content: '',
                    reason: '',
                }
            }
        },
        methods: {
            addActivity: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/addCpActivity.do',
                    data: this.add_activity,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('添加成功');
                            self.show_current = '活动列表';
                        }
                    }
                });
            }
        }
    });
    // 全部活动
    var totalActivity = Vue.component('activity-manage',{
        template:
        '<div>' +
            '<div class="nav">' +
                '<div class="current">全部活动</div>'+
            '</div>'+
            '<div>' +
                '<div class="filter">' +
                '<select v-model="state">' +
                    '<option :value="null">审核状态</option>'+
                    '<option>待处理</option>'+
                    '<option>已审核</option>'+
                    '<option>已通过</option>'+
                    '<option>已拒绝</option>'+
                '</select>'+
                '</div>'+
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="show_detail">' +
                    '<h3>活动详情</h3>'+
                    '<div>活动标题: <input disabled :value="detail_data.title" type="text"></div>'+
                    '<div>活动内容: <textarea disabled :value="detail_data.content"></textarea></div>'+
                    '<div>活动原因: <textarea disabled :value="detail_data.reason"></textarea></div>'+
                    '<div class="postData"><input @click="show_detail = false" class="save" type="button" value="关闭"></div>'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '活动列表',
                state: null,
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['标题','内容','原因','注册时间','申请状态','隐藏','操作'],
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
                    url: baseUrl + '/findCpActivity.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        state: this.state
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    title: item.title,
                                    content: item.content,
                                    reason: item.reason,
                                    registTime: self.$formatDate(item.registTime),
                                    state: item.state,
                                    operation: {
                                        get action(){
                                            switch(item.state){
                                                case '待处理':
                                                case '已审核':
                                                    return ['查看','同意','拒绝','删除'];
                                                case '已拒绝':
                                                    return ['查看','同意','删除']
                                                case '已通过':
                                                    return ['查看','拒绝','删除']
                                            }
                                        }
                                    }
                                };
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
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                    case '同意':
                    case '拒绝':
                    case '审核通过':
                        confirm('是否对该活动进行处理') &&
                            $.ajax({
                                url: baseUrl + '/updateCpActivity.do',
                                data: {
                                    token: token,
                                    cpActivityId: this.detail_data.cpActivityId,
                                    get state(){
                                        switch(value){
                                            case '同意':
                                                return '已通过';
                                            case '审核通过':
                                                return '已审核';
                                            case '拒绝':
                                                return '已拒绝';
                                        }
                                    }
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('处理成功');
                                    }
                                }
                            })
                        break;
                    case '删除':
                        confirm('是否确认删除') &&
                            $.ajax({
                                url: baseUrl + '/deleteCpActivity.do',
                                data: {
                                    token: token,
                                    cpActivityId: this.detail_data.cpActivityId
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                    }
                                }
                            });
                        break;
                }
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 部门活动
    var departmentActivity = Vue.component('department-activity',{
        template:
        '<div>' +
            '<div class="nav">' +
                '<div class="current">全部活动</div>'+
            '</div>'+
            '<div>' +
                '<div class="filter">' +
                '<select v-model="state">' +
                    '<option :value="null">审核状态</option>'+
                    '<option>待处理</option>'+
                    '<option>已审核</option>'+
                    '<option>已通过</option>'+
                    '<option>已拒绝</option>'+
                '</select>'+
                '</div>'+
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="show_detail">' +
                    '<h3>活动详情</h3>'+
                    '<div>活动标题: <input disabled :value="detail_data.title" type="text"></div>'+
                    '<div>活动内容: <textarea disabled :value="detail_data.content"></textarea></div>'+
                    '<div>活动原因: <textarea disabled :value="detail_data.reason"></textarea></div>'+
                    '<div class="postData"><input @click="show_detail = false" class="save" type="button" value="关闭"></div>'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '活动列表',
                state: null,
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['标题','内容','原因','注册时间','申请状态','隐藏','操作'],
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
                    url: baseUrl + '/findDepartmentCpActivity.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                        state: this.state
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    title: item.title,
                                    content: item.content,
                                    reason: item.reason,
                                    registTime: self.$formatDate(item.registTime),
                                    state: item.state,
                                    operation: {
                                        get action(){
                                            switch(item.state){
                                                case '待处理':
                                                    return ['查看','审核通过','拒绝','删除'];
                                                case '已审核':
                                                    return ['查看','拒绝','删除']
                                                case '已拒绝':
                                                    return ['查看','审核通过','删除']
                                                default:
                                                    return ['查看','删除']
                                            }
                                        }
                                    }
                                };
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
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                    case '同意':
                    case '拒绝':
                    case '审核通过':
                        confirm('是否对该活动进行处理') &&
                            $.ajax({
                                url: baseUrl + '/updateCpActivity.do',
                                data: {
                                    token: token,
                                    cpActivityId: this.detail_data.cpActivityId,
                                    get state(){
                                        switch(value){
                                            case '同意':
                                                return '已通过';
                                            case '审核通过':
                                                return '已审核';
                                            case '拒绝':
                                                return '已拒绝';
                                        }
                                    }
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('处理成功');
                                    }
                                }
                            })
                        break;
                    case '删除':
                        confirm('是否确认删除') &&
                            $.ajax({
                                url: baseUrl + '/deleteCpActivity.do',
                                data: {
                                    token: token,
                                    cpActivityId: this.detail_data.cpActivityId
                                },
                                type: 'post',
                                success: function (data) {
                                    if(data.state){
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                    }
                                }
                            });
                        break;
                }
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 员工业绩统计
    var employeePerformance = Vue.component('employee-performance',{
        template:
        '<div>' +
            '<div class="filter">' +
                '<public-dje @giveDje="$getDje($event)"></public-dje>' +
            '</div>' +
            '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging @givePageNo="$getPageNo($event)"></public-paging>'+
        '</div>',
        data:function () {
            return {
                tableTitle:['幼儿园名称','开园人姓名','开园费用','开园时间'],
                tableItem: [],
                pageNo: 1,
                pageCount: 1,
                responseData: null,
                detail_data: null,
                departmentNo: null,
                jobsNo: null,
                employeeNo: null,
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/employeePerformance.do',
                    data: {
                        token: token,
                        departmentNo: this.departmentNo,
                        jobsNo: this.jobsNo,
                        employeeNo: this.employeeNo,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    gartenName:item.gartenName,
                                    name: item.employee.name,
                                    money1: item.money1,
                                    registTime: self.$formatDate(item.registTime)
                                }
                            });
                        }
                    },error: function () {
                    }

                }
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 员工考勤卡
    var employeeCard = Vue.component('employee-card',{
        template:
            '<div>' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current:show_current=='+"'员工考勤卡列表'"+'}">员工考勤卡列表</div>'+
                    '<div :class="{current:show_current=='+"'押金退还记录'"+'}">押金退还记录</div>'+
                '</div>' +
                '<div v-show="show_current=='+"'员工考勤卡列表'"+'">' +
                    '<div class="filter">' +
                        '<public-dje @giveDje="$getDje($event)"></public-dje>'+
                        '<span>{{"考勤卡总数:"+count}}</span>'+
                        '<div @click="downCardTemplate" class="btn-skyblue">下载考勤卡模板</div>'+
                        '<div @click="importCard" class="btn-skyblue">导入考勤卡</div>'+
                        '<div @click="exportCard" class="btn-skyblue">导出考勤卡</div>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                    '<div class="look-Detaildata" v-show="import_data.show">' +
                        '<h3>导入考勤卡</h3>'+
                        '<div>*选择Excel文件: <input @change="reader($event)" type="file"></div>'+
                        '<div>考勤卡押金(没有不填): <input v-model="import_data.returnMoney" type="text"></div>'+
                    '<div class="postData">' +
                        '<input @click="importData" class="save" value="保存" type="button">' +
                        '<input @click="import_data.show = false" class="clear" value="取消" type="button">' +
                    '</div>'+
                    '</div>'+
                '</div>'+
                '<div v-show="show_current=='+"'押金退还记录'"+'">' +
                    '<div class="filter">' +
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'deposit.startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'deposit.endTime'"+')"></public-date>'+
                        '员工姓名: <input v-model="deposit.name" type="text">'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation_deposit" :title="tableTitle_deposit" :item="tableItem_deposit" :itemCount="16-tableItem_deposit.length"></public-table>'+
                    '<public-paging @givePageNo="$getPageNo($event,'+"'deposit'"+')" :pageCount="pageCount_deposit"></public-paging>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                show_current: '员工考勤卡列表',
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['内卡号','外卡号','押金','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                departmentNo: null,
                jobsNo: null,
                employeeNo: null,
                count: '',
                fr: new FileReader(),
                import_data: {
                    token: token,
                    show: false,
                    str: null,
                    agentId: null,
                    agentType: 0,
                    returnMoney: null,
                    fileName: ''
                },
                mustFill: ['str'],
                tableTitle_deposit: ['外卡号','押金退还金额','退还时间','退还人姓名','隐藏','操作'],
                tableItem_deposit: [],
                responseData_deposit: null,
                detail_data_deposit: null,
                pageCount_deposit: 2,
                deposit: {
                    token: token,
                    name: '',
                    startTime: 0,
                    endTime: 0,
                    pageNo: 1,
                },

            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/cardList.do',
                    data: {
                        token: token,
                        id: this.employeeNo,
                        agentType: 0,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.count = data.count;
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    inCard: item.inCard,
                                    outCard: item.outCard,
                                    returnMoney: item.returnMoney,
                                    operation: {
                                        action: ['退还押金']
                                    }
                                }
                            });
                        }
                    }
                }
            },
            xhr_deposit: function () {
                var self = this;
                return {
                    url: baseUrl + '/cardReturnList.do',
                    data: this.deposit,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount_deposit = data.info.pageCount;
                            self.responseData_deposit = data.info.list;
                            self.tableItem_deposit = self.responseData_deposit.map(function (item) {
                                return {
                                    outCard: item.outCard,
                                    returnMoney: item.returnMoney,
                                    returnTime: self.$formatDate(item.returnTime),
                                    name: item.name,
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
            },
            xhr_deposit: {
                deep: true,
                handler: function () {
                    $.ajax(this.xhr_deposit);
                }
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(员工考勤卡列表|押金退还记录)$/.test(target)){
                    this.show_current = target;
                }
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '退还押金':
                        confirm('是否确认退还押金') &&
                            $.ajax({
                                url: baseUrl + '/cardReturnMoney.do',
                                data: {
                                    token: token,
                                    cardId: this.detail_data.id
                                },
                                type: 'post',
                                success: function (data) {
                                    switch(data.state){
                                        case 1:
                                            alert('退还押金成功');
                                            $.ajax(self.xhr);
                                            break;
                                        case 2:
                                            alert('该考勤卡正在使用,请先解绑');
                                            break;
                                    }
                                },
                                error: function () {
                                }
                            });
                        break;
                }
            },
            getOperation_deposit: function (index,value,type) {
                var self = this;
                this.detail_data_deposit = this.responseData_deposit[index];
                switch(value){
                    case '删除':
                        confirm('是否确认删除') &&
                        $.ajax({
                            url: baseUrl + '/deleteCardReturn.do',
                            data: {
                                token: token,
                                returnId: this.detail_data_deposit.returnId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    $.ajax(self.xhr_deposit);
                                    alert('删除成功');
                                }else {
                                    alert('删除失败');
                                }
                            }
                        })
                        break;
                }
            },
            downCardTemplate: function () {
                location.href = baseUrl + '/downloadCardTemplate.do?token=' + token;
            },
            reader: function (e) {
                var file = e.target.files[0];
                if(!this.$isExcel(file)) return;
                this.import_data.fileName = file.name;
                this.fr.readAsDataURL(file);
            },
            importCard: function () {
                if(!this.employeeNo){
                    alert('未选择员工');
                    return;
                }
                this.import_data.show = true;
                this.import_data.agentId = this.employeeNo;
            },
            importData: function () {
                var self = this;
                if(this.$isNotFilled(this.import_data,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/importCard.do',
                    data: this.import_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            alert('导入成功');
                            self.import_data = {
                                token: token,
                                show: false,
                                str: null,
                                agentId: null,
                                agentType: 0,
                                returnMoney: null,
                                fileName: ''
                            };
                            $.ajax(self.xhr);
                        }else {
                            alert('文件未上传或上传错误');
                        }
                    },
                    error: function () {
                    }
                });
            },
            exportCard: function () {
                if(!this.employeeNo){
                    alert('未选择员工');
                    return;
                }
                location.href = baseUrl + '/exportCard.do?' + 'agentId=' + this.employeeNo + '&agentType=1&token=' + token;
            },
        },
        created: function () {
            var self = this;
            $.ajax(this.xhr);
            // $.ajax(this.xhr_deposit);
            this.fr.onload = function (e) {
                var txt = e.target.result,
                    arr = txt.split('base64,');
                self.import_data.str = arr[arr.length-1];
            }
        }
    });
    // 员工操作记录
    var operationLog = Vue.component('operation-log',{
        template:
        '<div>' +
            '<div @click="showTab($event)" class="nav">' +
                '<div class="current">员工操作记录</div>' +
            '</div>'+
            '<div>' +
                '<div class="filter">' +
                    '开始日期: <public-date @giveTimes="$getTimes($event,'+"'filter_data.startTime'"+')"></public-date>'+
                    '开始日期: <public-date @giveTimes="$getTimes($event,'+"'filter_data.endTime'"+')"></public-date>'+
                    '<select v-model="filter_data.type">' +
                    '<option :value="null">操作类型</option>'+
                    '<option :value="0">增加</option>'+
                    '<option :value="1">删除</option>'+
                    '<option :value="2">修改</option>'+
                    '</select>'+
                    '操作员名称: <input v-model="filter_data.fromName" type="text">'+
                    '被操作对象: <input v-model="filter_data.toName" type="text">'+
                    '操作内容: <input v-model="filter_data.content" type="text">'+
                '</div>'+
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                '<public-paging @givePageNo="$getPageNo($event,'+"'filter_data'"+')" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="show_employee">' +
                    '<h3>操作员信息</h3>'+
                    '<div>部门: <public-departments disabled :id="employee.departmentNo" ></public-departments></div>'+
                    '<div>职位: <public-jobs disabled :id="employee.jobsNo" ></public-jobs></div>'+
                    '<div>代理区域(销售人员填写): <public-address3 :disable="true" :_province="employee.province" :_city="employee.city" _counties="employee.countries"></public-address3></div>'+
                    '<div>姓名: <input disabled v-model="employee.name" type="text"></div>'+
                    '<div>性别: ' +
                        '<select disabled v-model="employee.sex">' +
                            '<option :value="0">男</option>'+
                            '<option :value="1">女</option>'+
                        '</select>'+
                    '</div>'+
                    '<div>入职时间: <public-date disabled :date="employee.entryTime" ></public-date></div>'+
                    '<div>手机号: <input disabled v-model="employee.phoneNumber" type="text"></div>'+
                    '<div>密码: <input disabled v-model="employee.pwd" type="text"></div>'+
                    '<div><public-permission disabled :pms="employee.permission" ></public-permission></div>'+
                    '<div class="postData">' +
                        '<input @click="show_employee = false" type="button" value="取消" class="clear">' +
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                filter_data:{
                    token: token,
                    type: null,
                    content: '',
                    fromName: '',
                    toName: '',
                    startTime: 0,
                    endTime: 0,
                    pageNo: 1,
                },
                pageCount: 1,
                tableTitle: ['操作日期','操作人姓名','操作类型','操作对象','操作对象类型','操作内容','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                show_employee: false,
                employee: null, //存放员工数据
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findOperateLog.do',
                    data: this.filter_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    registTime: self.$formatDate(item.registTime),
                                    fromName: item.fromName,
                                    type: item.type,
                                    toName: item.toName,
                                    toJob: item.toJob,
                                    content: item.content,
                                    operation: {
                                        action: ['查看操作员']
                                    }
                                }
                            });
                        }
                    },
                }
            }
        },
        watch: {
            filter_data: {
                deep: true,
                handler: function () {
                    $.ajax(this.xhr);
                }
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(/^(员工列表|员工添加)$/.test(target)){
                    this.show_current = target;
                }
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看操作员':
                        $.ajax({
                            url: baseUrl + '/findEmployee.do',
                            data: {
                                token: token,
                                employeeNo: self.detail_data.fromId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    self.employee = data.info.list[0];
                                    self.show_employee = true;
                                }
                            }
                        })
                        break;
                }
            }
        }
    });
    // 家长与宝宝关系
    var parentRelation = Vue.component('parent-relation',{
        template:
        '<div class="parentRelation">' +
            '<div class="nav" @click="showTab($event)">' +
                '<div :class="{current: show_current === '+"'关系列表'"+'}">关系列表</div>'+
                '<div :class="{current: show_current === '+"'关系添加'"+'}">关系添加</div>'+
            '</div>'+
            '<div v-show="show_current === '+"'关系列表'"+'">' +
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem"></public-table>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current === '+"'关系添加'"+'">' +
                '<div>新增关系名称: <input v-model="relation" type="text"></div>'+
                '<div class="postData"><input type="button" @click="addRelation" class="save" value="添加"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                tableTitle:['关系名称','隐藏','操作'],
                tableItem:[],
                show_current: '关系列表',
                relation: '',
                responseData: [],
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(target !== '关系列表' && target !== '关系添加') return;
                this.show_current = target;
            },
            requestData: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/relation.do',
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.responseData = data.info;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    relation: item.relation,
                                    operation: {
                                        action: ['删除']
                                    }
                                }
                            });
                        }
                    }
                });
            },
            addRelation: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/addrelation.do',
                    data: {
                        token: token,
                        relation: self.relation
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.requestData();
                            alert('添加成功');
                            self.show_current = '关系列表';

                        }
                    }
                });
            },
            getOperation: function (index,value,type) {
                var self = this;
                switch(value){
                    case '删除':
                        confirm('是否确认删除')&&
                        $.ajax({
                            url: baseUrl + '/deleterelation.do',
                            data: {
                                token: token,
                                relationId: self.responseData[index].relationId
                            },
                            type: 'post',
                            success: function (data) {
                                switch(data.state){
                                    case 0:
                                        alert('删除失败');
                                        break;
                                    case 1:
                                        self.requestData();
                                        alert('删除成功');
                                        break;
                                }
                            }
                        });
                        break;
                }
            }
        },
        beforeMount: function () {
            this.requestData();
        }
    });
    // 幼儿园类型设置
    var gartenType = Vue.component('garten-type',{
        template:
        '<div class="parentRelation">' +
            '<div class="nav" @click="showTab($event)">' +
                '<div :class="{current: show_current === '+"'幼儿园类型列表'"+'}">幼儿园类型列表</div>'+
                '<div :class="{current: show_current === '+"'幼儿园类型添加'"+'}">幼儿园类型添加</div>'+
            '</div>'+
            '<div v-show="show_current === '+"'幼儿园类型列表'"+'">' +
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem"></public-table>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current === '+"'幼儿园类型添加'"+'">' +
                '<div>新增幼儿园类型名称: <input v-model="gartenType.typeName" type="text"></div>'+
                '<div>备注: <textarea v-model="gartenType.mark"></textarea></div>'+
                '<div class="postData"><input type="button" @click="addGartenType" class="save" value="添加"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                tableTitle:['幼儿园类型名称','备注','隐藏','操作'],
                tableItem:[],
                show_current: '幼儿园类型列表',
                gartenType: {
                    token: token,
                    typeName: '',
                    mark: '',
                },
                responseData: [],
            }
        },
        methods: {
            showTab: function (e) {
                var target = e.target.innerText;
                if(target !== '幼儿园类型列表' && target !== '幼儿园类型添加') return;
                this.show_current = target;
            },
            requestData: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/findGartentype.do',
                    type: 'post',
                    data: {
                        token: token,
                        pageNo: 1
                    },
                    success: function (data) {
                        if(data.state){
                            self.responseData = data.info;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    typeName: item.typeName,
                                    mark: item.mark,
                                    operation: {
                                        action: ['删除']
                                    }
                                }
                            });
                        }
                    }
                });
            },
            addGartenType: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/addGartentype.do',
                    data: self.gartenType,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.requestData();
                            alert('添加成功');
                            self.show_current = '幼儿园类型列表';
                        }
                    },
                    error: function () {
                    }
                });
            },
            getOperation: function (index,value,type) {
                var self = this;
                switch(value){
                    case '删除':
                        confirm('是否确认删除')&&
                        $.ajax({
                            url: baseUrl + '/deleteGartentype.do',
                            data: {
                                token: token,
                                gartenType: self.responseData[index].gartenType
                            },
                            type: 'post',
                            success: function (data) {
                                switch(data.state){
                                    case 0:
                                        alert('删除失败');
                                        break;
                                    case 1:
                                        self.requestData();
                                        alert('删除成功');
                                        break;
                                }
                            }
                        });
                        break;
                }
            }
        },
        beforeMount: function () {
            this.requestData();
        }
    });
    // 清理垃圾数据
    // var emptyData = Vue.component('empty-data',{
    //     template:
    //     '<div>' +
    //         '<div  @click="emptyData" class="btn-skyblue">清理无效数据</div>'+
    //     '</div>',
    //     methods: {
    //         emptyData: function () {
    //             var promptInfo = prompt('清理无效数据需输入\"确认清理\",被清理的数据将不可恢复');
    //             if(promptInfo != '确认清理'){
    //                 if(!promptInfo) return;
    //                 alert('输入有误,清理失败');
    //                 return;
    //             }
    //             $.ajax({
    //                 url: baseUrl + '/deleteAll.do',
    //                 data: {
    //                     token: token
    //                 },
    //                 type: 'post',
    //                 success: function (data) {
    //                     if(data.state){
    //                         alert('清理成功');
    //                     }
    //                 }
    //             });
    //         }
    //     }
    // });


        // template:
        //     '<div>' +
        //         '<div @click="showTab($event)" class="nav">' +
        //             '<div :class="{current: show_current == '+"'员工考列表'"+'}">员工列表</div>'+
        //             '<div :class="{current: show_current == '+"'员工添加'"+'}">员工添加</div>'+
        //         '</div>'+
        //         '<div v-show="show_current=='+"''"+'">' +
        //             '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
        //             '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
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
        //     getOperation: function (index,value,type) {
        //     }
        // }

    var routes = [
        //个人信息
        {path: '/personalCenter', component: personalCenter},
        //统计
        {path: '/infoStatistics', component: infoStatistics},
        //信息管理
        {path: '/infoManage',component: infoManage},
        //幼儿园管理
        {path: '/kindergartenManage',component: kindergartenManage},
        //考勤卡管理
        {path: '/attendanceCardManage', component: attendanceCardManage},
        //清除考勤异常
        {path: '/clearUnusual', component: clearUnusual},
        //开园审核
        {path: '/kindergartenCheck',component: kindergartenCheck},
        //代理商管理
        {path: '/agentManage',component: agentManage},
        //代理商业绩统计
        {path: '/agentPerformance',component: agentPerformance},
        //代理商考勤卡
        {path: '/agentCard', component: agentCard},
        //代理商购买信用额度
        {path: '/agentCredit', component: agentCredit},
        //代理商提现管理
        {path: '/drawMoneyManage',component: drawMoneyManage},
        //视频、考勤收费价格设置
        {path: '/setChargePrice',component: setChargePrice},
        //消息推送
        {path: '/pushInfo',component: pushInfo},
        //考勤机
        {path: '/attendanceMachine',component: attendanceMachine},
        //考勤摄像头
        {path: '/attendanceCamera',component: attendanceCamera},
        //直播摄像头
        {path: '/liveCamera',component: liveCamera},
        //设备管理
        {path: '/equipManage', component: equipManage},
        //设备订单处理
        {path: '/equipOrder', component: equipOrder},
        //设备售后处理
        {path: '/afterSales', component: afterSales},
        //订单查看
        {path: '/orderLook',component: orderLook},
        //用户反馈
        {path: '/userFeedback',component: userFeedback},
        //员工管理
        {path: '/staffManage', component: staffManage},
        //部门管理
        {path: '/departmentManage', component: departmentManage},
        //职位管理
        {path: '/jobManage', component: jobManage},
        //添加报表
        {path: '/addReport', component: addReport},
        //全员报表
        {path: '/totalReport', component: totalReport},
        //部门报表
        {path: '/departmentReport', component: departmentReport},
        //开园申请
        {path: '/kindergartenApply', component: kindergartenApply},
        //设备申请
        {path: '/equipApply', component: equipApply},
        //部门设备
        {path: '/departmentEquip', component: departmentEquip},
        //添加活动
        {path: '/addActivity', component: addActivity},
        //全部活动
        {path: '/totalActivity', component: totalActivity},
        //部门活动
        {path: '/departmentActivity', component: departmentActivity},
        //员工考勤卡
        {path: '/employeeCard', component: employeeCard},
        //员工业绩统计
        {path: '/employeePerformance', component: employeePerformance},
        //员工操作记录
        {path: '/operationLog', component: operationLog},
        //家长与宝宝关系设置
        {path: '/parentRelation', component: parentRelation},
        //幼儿园类型设置
        {path: '/gartenType', component: gartenType},
        //清理无效数据 已删除的数据
        // {path: '/emptyData', component: emptyData},
    ];
    var router = new VueRouter({
        routes: routes
    });
    //转圈圈的loading动画
    var loader = new Vue({ 
        el: '#loader',
        data: {
            show: false
        }
    });
    var header = new Vue({
        el: '#header',
        data: {
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
            permission: JSON.parse(info.permission) || {}
        },
        computed: {
            gartenManage: function () {
                return  this.permission.infoStatistics ||
                    this.permission.infoManage ||
                    this.permission.kindergartenManage ||
                    this.permission.attendanceCardManage ||
                    this.permission.clearUnusual
            },
            check: function () {
                return this.permission.kindergartenCheck;
            },
            agentManage: function () {
                return this.permission.agentManage ||
                    this.permission.agentPerformance ||
                    this.permission.agentCard ||
                    this.permission.agentCredit ||
                    this.permission.drawMoneyManage;
            },
            feeSet: function () {
                return this.permission.setChargePrice;
            },
            messageCenter: function () {
                return this.permission.pushInfo;
            },
            terminalManage: function () {
                return this.permission.attendanceMachine ||
                    this.permission.attendanceCamera ||
                    this.permission.liveCamera;
            },
            equipManage: function () {
                return this.permission.equipManage ||
                    this.permission.equipOrder ||
                    this.permission.afterSales;
            },
            runCenter: function () {
                return this.permission.orderLook ||
                    this.permission.userFeedback;
            },
            companyManage: function () {
                return this.permission.staffManage ||
                    this.permission.departmentManage ||
                    this.permission.jobManage ||
                    this.permission.addReport ||
                    this.permission.totalReport ||
                    this.permission.departmentReport ||
                    this.permission.kindergartenApply ||
                    this.permission.equipApply ||
                    this.permission.departmentEquip ||
                    this.permission.addActivity ||
                    this.permission.totalActivity ||
                    this.permission.departmentActivity ||
                    this.permission.employeeCard ||
                    this.permission.employeePerformance ||
                    this.permission.operationLog;
            },
            baseSet: function () {
                return this.permission.parentRelation ||
                    this.permission.gartenType
                    // this.permission.emptyData;
            }
        },
    });

})(window, document);
