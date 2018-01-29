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
        token = info.token,
        gartenId = info.gartenId;
        console.log(info);
    }
    var url = Vue.prototype.$getOrigin();
    var baseUrl = url + '/smallcontrol';
    var date = (new Date().getTime())/1000;
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
        };
    //三级联动组件 加载时即获取数据  想用父元素访问子组件需要给组件上添加ref="xxx" 父组件.$refs.xxx.（data里的属性） 即可访问数据
    Vue.component('public-address3',{
        props:['disable'],
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
                this.city = this.current_city === '城市'? null:this.current_city;
            },
            current_counties: function () {
                this.counties = this.current_counties === '县区'? null:this.current_counties;
            },
            current_grade: function () {
                this.grade = this.current_grade;
            }
        },
    });


    Vue.prototype.$showTab = function ($event) {
        if($event.target.className == 'nav') return;
        var target = $event.target.innerText;
        this.show_current = target;
    }
    // 得到子组件当前的年级和班级
    Vue.prototype.$getGradeAndClass = function ($event) {
        this.gradeId = $event[0];
        this.classId = $event[1];
        this.babyId = $event[2];
        this.index = $event[3];
        this.gradeName = $event[4];
        this.className = $event[5];
    }
    Vue.prototype.$getTeacherClass = function ($event) {
        this.classIds = $event[0];
    }
    //传入一个数组 数组里是日期格式 转成时间戳 排序 判断是否已开通考勤和视频 如果截止日期大于当前日期，则显示已开通
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




    // 幼儿园下的年级和班级
    Vue.component('public-gradeAndClass',{
        //hideClass = true  _gradeId 设置默认选择的年级  _classId 设置默认选择的班级 隐藏班级下拉框 showBaby = true 显示宝宝下拉框
        props: ['_gradeId','_classId','_babyId','index','hideClass','showBaby'],
        template:
            '<div class="inlineBlock">' +
                '<select @change="getText($event,'+"'grade'"+')" v-model="gradeId">' +
                    '<option :value="null">年级</option>'+
                    '<option v-for="item in gradeList" :value="item.id">{{item.name}}</option>'+
                '</select>'+
                '<select @change="getText($event,'+"'class'"+')" v-show="!hideClass" v-model="classId">' +
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
            xhr_grade: function () {
                var self = this;
                return {
                    url: baseUrl + '/findGartenGrade.do',
                    data: {
                        gartenId: gartenId,
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
                        }
                    }
                }
            },
            xhr_class: function () {
                var self = this;
                return {
                    url: baseUrl + '/findGartenClass.do',
                    data: {
                        gartenId: gartenId,
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
            _gradeId: function () {
                this.gradeId = this._gradeId;
            },
            _classId: function () {
                this.classId = this._classId;
            },
            _babyId: function () {
                this.babyId = this._babyId;
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
            getText: function ($event,type) {
                var sel = $event.target,
                    index = sel.selectedIndex;
                switch(type){
                    case 'grade':
                        this.gradeName = sel[index].innerHTML;
                        break;
                    case 'class':
                        this.className = sel[index].innerHTML;
                        break;
                }
            },
            giveGradeAndClass: function () {
                this.$emit('giveGradeAndClass',[this.gradeId,this.classId,this.babyId,this.index,this.gradeName,this.className]);
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
    // 登录的老师所带班级
    Vue.component('public-teacherClass',{
        template:
        '<div>' +
            '<select v-model="leadGrade">'+
                '<option>年级</option>'+
                '<option v-if="key != '+"'年级'"+'" v-for="(value,key) in teacherClass">{{key}}</option>'+
            '</select>'+
            '<select v-model="classId">'+
                '<option :value="null">班级</option>'+
                '<option v-if="item.classId != null" v-for="item in teacherClass[leadGrade]['+"'classes'"+']" :value="item.classId">{{item.leadClass}}</option>'+
            '</select>'+
        '</div>',
        data: function () {
            return {
                teacherClass: [],
                classId: null,
                leadGrade: '年级'
            }
        },
        computed: {
            classIds: function () {
                if(this.classId){
                    return [this.classId];
                }
                if(this.leadGrade == '年级'){
                    var arr = [];
                    for(var k in this.teacherClass){
                        arr =  arr.concat(this.teacherClass[k].classes);
                    }
                    var classes =  arr.map(function (item) {
                        return item.classId;
                    });
                    this.$removeValue(classes,null);
                    return classes;
                }else {
                    return this.teacherClass[this.leadGrade].classes.map(function (item) {
                        return item.classId;
                    });
                }
            }
        },
        watch: {
            classIds: function () {
                this.giveTeacherClass();
            },
            leadGrade: function () {
                this.classId = null;
            }
        },
        methods: {
            giveTeacherClass: function () {
                console.log(this.classIds);
                this.$emit('giveTeacherClass',[this.classIds])
            }
        },
        created: function () {
            var gartenClasses = info.gartenClasses;
            var teacherClass = {
                '年级':{
                    gradeId: null,
                    classes: [
                        {
                            classId: null,
                            leadClass: '班级'
                        }
                    ],
                }
            }
            for(var i = 0, hash = {}; i < gartenClasses.length; i++){
                var grade = gartenClasses[i],
                    gradeId = grade.gradeId,
                    leadGrade = grade.leadGrade;
                if(!hash[leadGrade]){
                    hash[leadGrade] = true;
                    teacherClass[leadGrade] = {
                        gradeId: gradeId,
                        classes: [
                            {
                                classId: grade.classId,
                                leadClass: grade.leadClass
                            }
                        ],
                    }
                }else {
                    teacherClass[leadGrade].classes.push({
                        classId: grade.classId,
                        leadClass: grade.leadClass
                    });
                }
            }
            console.log(teacherClass);
            this.teacherClass = teacherClass;
        }
    });
    //幼儿园有哪些老师组件（已失效）
    Vue.component('public-teachers',function (resolve,reject) {
        $.ajax({
            url: baseUrl + '/workerMessageNo.do',
            data: {
                token: token
            },
            type: 'post',
            success: function (data) {
                var teacherList = {
                    data: [],
                    id: null
                };
                data.info.forEach(function (item,index) {
                     var  teacher = {};
                     teacher.name = item.workerName;
                     teacher.id = item.workerId;
                     teacherList.data[index] = teacher;
                });
                resolve({
                    template:
                        '<select class="teacherList" v-model="id">' +
                            '<option :value="null">老师</option>'+
                            '<option v-for="teacher in data" :value="teacher.id">{{teacher.name}}</option>'+
                        '</select>',
                    data: function () {
                        return teacherList;
                    },
                    watch: {
                        id: function () {
                            this.giveTeacherId();
                        }
                    },
                    methods: {
                        giveTeacherId: function () {
                            this.$emit('giveTeacherId', this.id);
                        }
                    }
                })
            }
        })
    });
    //获取一个宝宝的所有家长
    Vue.component('public-babyParents',{
        props: ['babyId','parentId'], //babyId: 当前选择的宝宝ID parentId: 通过id初始展示出当前家长的姓名
        template:
        '<select v-model="id">' +
            '<option v-for="parent in parents" :value="parent.id">{{parent.name}}</option>'+
        '</select>',
        data: function () {
            return {
                parents: [], //存放所有请求过来的家长列表
                id: null, //当前选择的id
            }
        },
        computed: {
            _babyId: function () {  // _babyId: this.babyId, //接受传递过来的babyId 并监视计算
                return this.babyId;
            }
        },
        watch: {
            _babyId: function () {
                this.requestData(); //宝宝ID发生变化 重新请求
            },
            id: function () {
                this.$emit('giveParentId',this.id);
            }
        },
        methods: {
            requestData: function () {
                var self = this;
                if(!this.babyId) return;
                $.ajax({
                    url: baseUrl + '/getminorParent.do',
                    data: {
                        babyId: self._babyId
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state != 1) return;
                        var parents = [];
                        data.info.forEach(function (item,index) {
                            var parent = {
                                name: item.parentName,
                                id: item.parentId
                            }
                            parents[index] = parent;
                        });
                        self.parents = parents;
                        if(self.parentId){
                            self.id = self.parentId;
                        }
                    }
                });
            }
        },
        created: function () {
            this.requestData();
        }
    });
    //宝宝与家长关系选项
    Vue.component('public-parentRelation',{
        // index 用于v-for生成组件时区分组件
        props: ['index'],
        template:
            '<select v-model="relation">' +
                '<option :value="null">家长关系</option>'+
                '<option v-for="relation in relations">{{relation.relation}}</option>'+
            '</select>',
        data: function () {
            return {
                relations: [],
                relation: null
            }
        },
        watch: {
            relation: function () {
                this.giveParentRelation();
            }
        },
        methods:  {
            giveParentRelation: function () {
                this.$emit('giveParentRelation',[this.relation,this.index]);
            }
        },
        created: function () {
            var self = this;
            $.ajax({
                url: url + '/bigcontrol/relation.do',
                type: 'post',
                success: function (data) {
                    if(data.state){
                        self.relations = data.info;
                        self.giveParentRelation();
                    }
                }
            });
        }
    });
    //分配权限
    Vue.component('public-permission',{
        props: ['pms'],
        template:
        '<div class="permission">' +
            '<h3>权限: </h3>'+
            '<div><i></i>信息管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.kindergartenManage" type="checkbox">幼儿园信息</li>'+
                '<li><input v-model="permission.teacherManage" type="checkbox">教职工管理</li>'+
                '<li><input v-model="permission.babyManage" type="checkbox">宝宝管理</li>'+
                '<li><input v-model="permission.patriarchManage" type="checkbox">家长管理</li>'+
            '</ul>'+
            '<div><i></i>消息中心</div>' +
            '<ul>' +
                '<li><input v-model="permission.pushInfo" type="checkbox">消息推送</li>'+
                '<li><input v-model="permission.infoHistory" type="checkbox">消息历史</li>'+
                '<li><input v-model="permission.applyPushInfo" type="checkbox">申请发送短信</li>'+
                '<li><input v-model="permission.infoCheck" type="checkbox">短信审核</li>'+
            '</ul>'+
            '<div><i></i>班级管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.gradeManage" type="checkbox">年级管理</li>'+
                '<li><input v-model="permission.classManage" type="checkbox">班级管理</li>'+
                '<li><input v-model="permission.upGradeManage" type="checkbox">升班管理</li>'+
            '</ul>'+
            '<div><i></i>考勤管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.attendanceTimeManage" type="checkbox">考勤时间管理</li>'+
                '<li><input v-model="permission.attendanceCardManage" type="checkbox">考勤卡管理</li>'+
                '<li><input v-model="permission.attendanceHistory" type="checkbox">打卡记录</li>'+
                '<li><input v-model="permission.attendanceAnomalyManage" type="checkbox">考勤异常管理</li>'+
                '<li><input v-model="permission.leaveManage" type="checkbox">请假管理</li>'+
            '</ul>'+
            '<div><i></i>晨检统计</div>' +
            '<ul>' +
                '<li><input v-model="permission.morningCheckLook" type="checkbox">晨检查看</li>'+
            '</ul>'+
            '<div><i></i>课程管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.curriculumManage" type="checkbox">课程管理</li>'+
            '</ul>'+
            '<div><i></i>食谱管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.cookbookSet" type="checkbox">食谱设置</li>'+
                '<li><input v-model="permission.cookbookList" type="checkbox">食谱列表</li>'+
            '</ul>'+
            '<div><i></i>财务管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.payQuery" type="checkbox">付费查询</li>'+
                '<li><input v-model="permission.payFees" type="checkbox">全员缴费</li>'+
            '</ul>'+
            '<div><i></i>校园管理</div>' +
            '<ul>' +
                '<li><input v-model="permission.schoolIntroduction" type="checkbox">校园简介</li>'+
                '<li><input v-model="permission.schoolActivity" type="checkbox">校园活动</li>'+
            '</ul>'+
            '<div><i></i>其他</div>' +
            '<ul>' +
                '<li><input v-model="permission.ideaFeedback" type="checkbox">意见反馈</li>'+
            '</ul>'+
        '</div>',
        data: function () {
            return {
                imgUrl: '',
                permission: {
                    kindergartenManage: false,
                    teacherManage: false,
                    babyManage: false,
                    patriarchManage: false,
                    pushInfo: false,
                    infoHistory: false,
                    applyPushInfo: false,
                    infoCheck: false,
                    gradeManage: false,
                    classManage: false,
                    upGradeManage: false,
                    attendanceTimeManage: false,
                    attendanceCardManage: false,
                    attendanceHistory: false,
                    attendanceAnomalyManage: false,
                    leaveManage: false,
                    morningCheckLook: false,
                    curriculumManage: false,
                    cookbookSet: false,
                    cookbookList: false,
                    payQuery: false,
                    payFees: false,
                    schoolIntroduction: false,
                    schoolActivity: false,
                    ideaFeedback: false
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
                $(this).toggleClass('open').parent().next('ul').slideToggle(0);
            });
        }
    });

    /*---------------------------------------*/

    // 个人中心
    var personalInfo = Vue.component('info-manage',{
        template:
            '<div v-if="detail_data" class="look-Detaildata">' +
                '<h3>个人信息</h3>'+
                '<div>注册时间: <input disabled type="text" :value="$formatDate(detail_data.registTime)" ></div>'+
                '<div>姓名: <input disabled :value="detail_data.workerName" type="text" ></div>'+
                '<div>性别: ' +
                    '<select :value="detail_data.sex">' +
                        '<option :value="0">男</option>'+
                        '<option :value="1">女</option>'+
                    '</select>'+
                '</div>'+
                '<div>年龄: <input disabled :value="detail_data.age" type="text"></div>'+
                '<div>手机号: <input disabled :value="detail_data.phoneNumber"  type="text"></div>'+
                '<div>所带班级:</div>'+
                '<ul>' +
                    '<li v-for="(item,index) in detail_data.gartenClasses" ><public-gradeAndClass :_gradeId="item.gradeId" :_classId="item.classId"></public-gradeAndClass></li>'+
                '</ul>'+
                '<div>学历: <input disabled :value="detail_data.education" type="text" ></div>'+
                '<div>教师资格证: <input disabled :value="detail_data.certificate" type="text"></div>'+
                '<div>普通话等级: <input disabled :value="detail_data.chinese" type="text" ></div>'+
                '<div>职称: <input disabled :value="detail_data.jobcall" type="text"></div>'+
                '<div>红花数: <input disabled :value="detail_data.flowers" type="text" disabled ></div>'+
            '</div>',
        data: function () {
            return {
                detail_data: null
            }
        },
        methods: {

        },
        created: function () {
            this.detail_data = info;
            console.log(info);
        }
    });
    // 幼儿园信息
    var kindergartenManage = Vue.component('kindergarten-manage',{
        template:
        '<div class="kindergartenManage">'+
            '<div class="look-Detaildata" v-if="detail_data" >'+
                '<h3>幼儿园详细信息</h3>'+
                '<div>注册时间: <input disabled :value="$formatDate(detail_data.registTime)" type="text"></div>'+
                '<div>幼儿园名: <input disabled :value="detail_data.gartenName" type="text"></div>'+
                '<div>联系人: <input disabled :value="detail_data.name" type="text" ></div>'+
                '<div>代理人: <input disabled :value="detail_data.agentType == 0? detail_data.employee.name : detail_data.agentInfo.name" type="text"></div>'+
                '<div>代理人联系方式: <input disabled :value="detail_data.agentType == 0? detail_data.employee.phoneNumber : detail_data.agentInfo.phoneNumber" type="text"></div>'+
                '<div>幼儿园归属人联系方式: <input disabled :value="detail_data.phoneNumber" type="text" ></div>'+
                '<div>合同编号: <input disabled :value="detail_data.contractNumber" type="text" ></div>'+
                '<div>合同起始日期: <input disabled :value="$formatDate(detail_data.contractStart)" type="text" ></div>'+
                '<div>合同截止日期: <input disabled :value="$formatDate(detail_data.contractEnd)" type="text"></div>'+
                '<div>省份: <input disabled :value="detail_data.province" type="text"></div>'+
                '<div>城市: <input disabled :value="detail_data.city" type="text"></div>'+
                '<div>县区: <input disabled :value="detail_data.countries" type="text"></div>'+
                '<div>详细地址: <input disabled v-model="detail_data.address" type="text"></div>'+
                '<div>幼儿园学费标准: <input disabled v-model="detail_data.charge" type="text"></div>'+
                '<div>幼儿园视频截止日期: <input disabled :value="$formatDate(detail_data.monitorTime)" type="text"></div>'+
                '<div>幼儿园考勤截止日期: <input disabled :value="$formatDate(detail_data.attendanceTime)" type="text"></div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                detail_data: null,
                tableTitle: ['幼儿园', '联系人','联系方式', '注册时间', '合同起始日期','合同截止日期','隐藏', '操作'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/getGartenMessage.do',
                    data: {
                        token: token,
                    },
                    type: 'post',
                    success: function (data) {
                        if(!data.state) return;
                        self.detail_data = data.info;
                    },
                    error: function () {
                    }
                }
            }
        },
        created:function () {
            $.ajax(this.xhr);
        }
    });
    // 使用者管理
    var adminManage = Vue.component('admin-manage',{
       template:
       '<div class="adminManage">' +
            '<div class="nav" @click="showTab($event)">'+
                '<div :class="{current:show_current === '+"'管理员列表'"+'}">管理员列表</div>'+
                '<div :class="{current:show_current === '+"'管理员添加'"+'}">管理员添加</div>'+
            '</div>'+
            '<div class="admin-list" v-show="show_current === '+"'管理员列表'"+'">' +
                '<h3>管理员列表: </h3>'+
                '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
                '<public-paging></public-paging>'+
                '<div class="look-Detaildata" v-show="recompose_admin">' +
                    '<h3>查看/修改管理员信息</h3>'+
                    '<div>注册时间: <input type="text" disabled></div>'+
                    '<div>姓名: <input type="text"></div>'+
                    '<div>职称: <input type="text"></div>'+
                    '<div>手机号: <input type="text"></div>'+
                    '<div>密码: <input type="text"></div>'+
                    '<div>注册时间: <input type="text" disabled></div>'+
                    '<div class="postData"><input class="save" type="button" value="保存">&nbsp&nbsp&nbsp&nbsp<input @click="recompose_admin=false" class="clear" type="button" value="取消"></div>'+
                '</div>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current === '+"'管理员添加'"+'">' +
                '<h3>管理员添加</h3>'+
                '<div>姓名*: <input type="text"></div>'+
                '<div>手机号*: <input type="text"></div>'+
                '<div>职称: <input type="text"></div>'+
                '<p class="mark">注: *为必填项 账号名默认为手机号 密码默认为123456</p>'+
                '<div class="postData"><input class="save" type="button" value="保存"></div>'+
            '</div>'+
       '</div>',
        data:function () {
          return {
              show_current: '管理员列表',
              recompose_admin:false,
              tableTitle: ['姓名','手机号','注册时间','隐藏','操作'],
              tableItem:[]
          }
        },
        methods:{
            showTab:function (e) {
                this.show_current = e.target.innerHTML;
            },
            getOperation:function (index,value,type) {
                switch(value){
                    case '修改':
                        this.recompose_admin = true;
                        break;
                }
            }
        }
    });
    // 教职工管理
    var teacherManage = Vue.component('teacher-manage',{
        template:
        '<div class="teacherManage">' +
            '<div class="nav" @click="$showTab($event)">'+
                '<div :class="{current:show_current === '+"'教职工列表'"+'}">教职工列表</div>'+
                '<div :class="{current:show_current === '+"'教职工添加'"+'}">教职工添加</div>'+
            '</div>'+
            '<div class="teacher-list" v-show="show_current === '+"'教职工列表'"+'">' +
                '<div class="filter">'+
                    '<div class="inlineBlock">姓名: <input v-model="name" class="name" type="text"></div>'+
                    '<div class="inlineBlock">手机号: <input v-model="phoneNumber" class="phoneNumber" type="text"></div>'+
                    '<div v-show="personCount" class="inlineBlock">总人数: <span v-text="personCount"></span></div>'+
                '</div>'+
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
                '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="recompose_teacher">' +
                    '<h3>教职工信息查看修改: </h3>'+
                    '<div>注册时间: <input disabled type="text" :value="$formatDate(detail_data.registTime)" ></div>'+
                    '<div>*姓名: <input v-model="detail_data.workerName" type="text" ></div>'+
                    '<div>性别: ' +
                        '<select v-model="detail_data.sex">' +
                            '<option :value="0">男</option>'+
                            '<option :value="1">女</option>'+
                        '</select>'+
                    '</div>'+
                    '<div>年龄: <input v-model="detail_data.age" type="text"></div>'+
                    '<div>*手机号: <input v-model="detail_data.phoneNumber"  type="text"></div>'+
                    '<div v-show="detail_data.job == teacher">所带班级: <input type="button" class="btn" value="添加班级" @click="addClass"></div>'+
                    '<ul v-show="detail_data.job == teacher">' +
                        '<li v-for="(item,index) in teacherClass" ><public-gradeAndClass :_gradeId="teacherClass[index].gradeId" :_classId="teacherClass[index].classId" @giveGradeAndClass="getGradeAndClass($event,index)"></public-gradeAndClass><input type="button" @click="deleteClass(index)" class="btn" value="删除"></li>'+
                    '</ul>'+
                    '<div v-show="detail_data.job == teacher">学历: <input v-model="detail_data.education" type="text" ></div>'+
                    '<div v-show="detail_data.job == teacher">教师资格证: <input v-model="detail_data.certificate" type="text"></div>'+
                    '<div v-show="detail_data.job == teacher">普通话等级: <input v-model="detail_data.chinese" type="text" ></div>'+
                    '<div v-show="detail_data.job == teacher">职称: <input v-model="detail_data.jobcall" type="text"></div>'+
                    '<div v-show="detail_data.job == teacher">红花数: <input :value="detail_data.flowers" type="text" disabled ></div>'+
                    '<public-permission :pms="detail_data.permission" @givePermission="getPermission_alter"></public-permission>'+
                    '<div class="postData"><input class="save" @click="alterData" type="button" value="修改">&nbsp&nbsp&nbsp&nbsp<input @click="recompose_teacher=false" class="clear" type="button" value="取消"></div>'+
                '</div>'+
            '</div>'+
            '<div class="add-Newdata" v-if="show_current === '+"'教职工添加'"+'">' +
                '<h3>教职工添加</h3>'+
                '<div>选择教职工类型: ' +
                    '<select v-if="isTeacherOrGuard(add_data.job)" v-model="add_data.job">' +
                        '<option>老师</option>'+
                        '<option>门卫</option>'+
                        '<option>其他</option>'+
                    '</select>' +
                    '<input v-if="!isTeacherOrGuard(add_data.job)" type="text" v-model="add_data.job">'+
                '</div>'+
                '<div>*姓名: <input v-model="add_data.teacherName" type="text" value="" ></div>'+
                '<div>性别: ' +
                    '<select v-model="add_data.sex">' +
                        '<option :value="null">请选择</option>'+
                        '<option :value="0">男</option>'+
                        '<option :value="1">女</option>'+
                    '</select>'+
                '</div>'+
                '<div>年龄: <input v-model="add_data.age" type="text"></div>'+
                '<div>*手机号: <input v-model="add_data.phoneNumber" type="text"></div>'+
                '<div v-show="add_data.job == teacher">所带班级: <input type="button" class="btn" value="添加班级" @click="addClass"></div>'+
                '<ul v-show="add_data.job == teacher">' +
                    '<li v-for="(item,index) in teacherClass" ><public-gradeAndClass :_gradeId="teacherClass[index].gradeId" :_classId="teacherClass[index].classId" @giveGradeAndClass="getGradeAndClass($event,index)"></public-gradeAndClass><input type="button" @click="deleteClass(index)" class="btn" value="删除"></li>'+
                '</ul>'+
                '<div v-show="add_data.job == teacher">学历: <input v-model="add_data.education" type="text"></div>'+
                '<div v-show="add_data.job == teacher">教师资格证: <input v-model="add_data.certificate" type="text"></div>'+
                '<div v-show="add_data.job == teacher">普通话等级: <input v-model="add_data.chinese" type="text"></div>'+
                '<div v-show="add_data.job == teacher">职称: <input v-model="add_data.jobCall" type="text"></div>'+
                '<public-permission @givePermission="getPermission"></public-permission>'+
                '<p class="mark">备注: *为必填项</p>'+
                '<div class="postData"><input @click="addData" class="save" type="button" value="保存"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                teacher: '老师', //用于显示添加对象为老师时  需要显示的数据
                name:'',
                phoneNumber:'',
                personCount: 0,
                pageCount:1,
                pageNo:1,
                show_current: '教职工列表',
                recompose_teacher:false,
                responseData:[],
                detail_data: null,
                teacherClass: [//用于存放添加、修改老师所带班级
                    {
                        gradeId: null,
                        classId: null,
                    },
                ],
                other: '', //教职工可以选择其他
                add_data: {
                    token: token,
                    job: '老师',
                    teacherName: '',
                    sex: null,
                    age: '',
                    phoneNumber: '',
                    classId: [],
                    education: '',
                    certificate: '',
                    chinese: '',
                    jobCall: '',
                    permission: '',
                },
                mustFill: ['teacherName','phoneNumber'],
                mustFill_alter: ['workerName','phoneNumber'],
                tableTitle:['类型','姓名', '性别', '年龄', '手机','所带班级','隐藏', '操作'],
                tableItem:[],
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/workerMessage.do',
                    data: {
                        token: token,
                        name: this.name,
                        phoneNumber: this.phoneNumber,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        console.log(data);
                        if(data.state !== 1) return;
                        self.personCount = data.count;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        console.log(self.responseData);
                        self.tableItem = self.responseData.map(function (item) {
                            return {
                                job: item.job,
                                name: item.workerName,
                                sex:  item.sex == 0? '男' : '女',
                                age: item.age,
                                phoneNumber:  item.phoneNumber,
                                get lead(){
                                    if(!item.gartenClasses){
                                        return '';
                                    }else {
                                        return item.gartenClasses.map(function (item) {
                                            return (item.leadGrade + item.leadClass);
                                        }).join(',');
                                    }
                                },
                                operation: {
                                    action:['查看/修改','删除']
                                }
                            }
                        });
                    }
                }
            }
        },
        watch: {
            recompose_teacher: function () {
                if(!this.recompose_teacher){
                    this.teacherClass = [
                        {
                            gradeId: null,
                            classId: null,
                        },
                    ]
                }
            },
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getPageNo: Vue.prototype.$getPageNo,
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value){
                    case '查看/修改':
                        this.recompose_teacher = true;
                        this.teacherClass = this.detail_data.gartenClasses.map(function (item) {
                            return {
                                gradeId: item.gradeId,
                                classId: item.classId
                            }
                        });
                        break;
                    case '删除':
                        confirm('是否确认删除')&&
                            $.ajax({
                                url: baseUrl + '/deleteTeacher.do',
                                data: {
                                    token: token,
                                    workerId: self.detail_data.workerId
                                },
                                type: 'post',
                                success: function (data) {
                                    switch (data.state){
                                        case 0: alert('删除失败');
                                            break;
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
            getPermission: function (permission) {
                this.add_data.permission = permission;
            },
            addClass: function () {
                var obj = {
                    gradeId: null,
                    classId: null,
                }
                var teacherClass = this.teacherClass;
                teacherClass.splice(teacherClass.length,0,obj);
            },
            deleteClass: function (index) {
                this.teacherClass.splice(index,1);
            },
            getGradeAndClass: function ($event,index) {
                var obj = {
                    gradeId: $event[0],
                    classId: $event[1]
                }
                this.teacherClass.splice(index,1,obj);
            },
            getClassId: function () {
                var classId = this.teacherClass.map(function (item) {
                    return item.classId;
                });
                this.$removeValue(classId,null);
                classId = this.$removeRepeat(classId);
                return classId;
            },
            isTeacherOrGuard: function (type) {
                  if(type == '老师' || type == '门卫') {
                      return true;
                  }else {
                      return false;
                  }
            },
            addData: function () {
                var self = this;
                this.add_data.classId = this.getClassId();
                if(this.add_data.job == '老师' && this.add_data.classId.length == 0){
                    alert('未填写班级');
                    return;
                }
                if(this.$isNotFilled(this.add_data,this.mustFill)) return;
                loader.show = true;
                $.ajax({
                    url: baseUrl + '/addTeacher.do',
                    data: self.add_data,
                    type: 'post',
                    success: function (data) {
                        loader.show = false;
                        switch(data.state){
                            case 0: return;
                            case 1:
                                $.ajax(self.xhr);
                                self.show_current = '教职工列表';
                                alert('添加成功');
                                this.teacherClass = [{
                                    gradeId: null,
                                    classId: null,
                                }];
                                break;
                            case 2:
                                alert('改手机号已注册');
                                break;
                        }
                    },
                    traditional: true,
                    error: function () {
                        loader.show = false;
                    }
                });
            },
            getPermission_alter: function (permission) {
                this.detail_data.permission = permission;
            },

            alterData: function () {
                var self = this;
                var detail_data = this.detail_data;
                detail_data.token = token;
                detail_data.classId = this.getClassId();

                if(detail_data.classId.length == 0){
                    alert('未填写班级');
                    return;
                }
                if(this.$isNotFilled(detail_data,this.mustFill_alter)) return;
                $.ajax({
                    url: baseUrl + '/updateTeacher.do',
                    data: detail_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0: alert('修改失败');
                            break;
                            case 1:
                                $.ajax(self.xhr);
                                alert('修改成功');
                                self.recompose_teacher = false;
                                break;
                            case 3:
                                alert('该手机号已注册');
                                break;
                        }
                    },
                    traditional: true
                })
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 宝宝管理
    var babyManage = Vue.component('baby-manage',{
        template:
        '<div class="babyManage">' +
            '<div class="nav" @click="$showTab($event)">'+
                '<div :class="{current:show_current === '+"'宝宝列表'"+'}">宝宝列表</div>'+
                '<div :class="{current:show_current === '+"'宝宝添加'"+'}">宝宝添加</div>'+
            '</div>'+
            '<div class="baby-list" v-show="show_current === '+"'宝宝列表'"+'">' +
                '<div class="filter">'+
                    '姓名: <input v-model="name" class="name" type="text">'+
                    '<public-gradeAndClass v-on:giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>'+
                    '<div v-show="personCount" class="inlineBlock">总人数: <span v-text="personCount"></span></div>'+
                '</div>'+
                '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
                '<public-paging v-on:givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="recompose_baby">' +
                    '<h3>查看/修改宝宝信息</h3>'+
                    '<div>id: <input :value="detail_data.babyId" type="text" disabled></div>'+
                    '<div>原班级为: <input type="text" :value="detail_data.originClass" disabled></div>'+
                    '<div>注册时间: <input disabled type="text" :value="$formatDate(detail_data.registTime)" disabled></div>'+
                    '<div>*班级: <public-gradeAndClass :_gradeId="detail_data.gradeId" :_classId="detail_data.classId" v-on:giveGradeAndClass="getClassId_alter"></public-gradeAndClass></div>'+
                    '<div>*姓名: <input v-model="detail_data.babyName" type="text" value=""></div>'+
                    '<div>性别: ' +
                        '<select v-model="detail_data.sex">'+
                            '<option :value="0">男</option>'+
                            '<option :value="1">女</option>'+
                        '</select>'+
                    '</div>'+
                    '<div>出生日期: <public-date :date="detail_data.birthday" v-on:giveTimes="getBirthday_alter"></public-date></div>'+
                    '<div>身高(cm): <input v-model="detail_data.height" type="text" value=""></div>'+
                    '<div>体重(kg): <input v-model="detail_data.weight" type="text" value=""></div>'+
                    '<div>健康状况: <input v-model="detail_data.health" type="text" value=""></div>'+
                    '<div>兴趣爱好: <input v-model="detail_data.hobby" type="text" value=""></div>'+
                    '<div>特长: <input v-model="detail_data.specialty" type="text" value=""></div>'+
                    '<div>过敏史: <input v-model="detail_data.allergy" type="text" value=""></div>'+
                    '<div>*监护人: <public-babyParents v-on:giveParentId="getParentId" :babyId="detail_data.babyId" :parentId="detail_data.parentId"></public-babyParents></div>'+
                    '<div>监护人关系(更改主监护人后自动获取): <input :value="detail_data.parentRelation" disabled type="text"></div>'+
                    '<div>*监护人手机号: <input :value="detail_data.phoneNumber" disabled type="text"></div>'+
                    '<div class="postData"><input @click="alterData" class="save" type="button" value="修改">&nbsp&nbsp&nbsp&nbsp<input @click="recompose_baby=false" class="clear" type="button" value="取消"></div>'+
                '</div>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current === '+"'宝宝添加'"+'">' +
                '<h3>宝宝添加(确保已添加班级)</h3>'+
                '<div>*选择年级、班级: <public-gradeAndClass v-on:giveGradeAndClass="getClassId_add"></public-gradeAndClass></div>'+
                '<div>*姓名: <input v-model="add_data.babyName" type="text"></div>'+
                '<div>性别: '+
                    '<select v-model="add_data.sex">' +
                        '<option :value="null">请选择</option>'+
                        '<option :value="0">男</option>'+
                        '<option :value="1">女</option>'+
                    '</select>' +
                '</div>'+
                '<div>身份证: <input v-model="add_data.cardId" type="text"></div>'+
                '<div>身高(cm): <input v-model="add_data.height" type="text" placeholder="无需填写单位"></div>'+
                '<div>体重(kg): <input v-model="add_data.weight" type="text" placeholder="无需填写单位"></div>'+
                '<div>出生日期: <public-date v-on:giveTimes="getBirthday_add"></public-date></div>'+
                '<div>健康状态: <input v-model="add_data.health" type="text"></div>'+
                '<div>兴趣爱好: <input v-model="add_data.hobby" type="text"></div>'+
                '<div>特长: <input v-model="add_data.specialty" type="text"></div>'+
                '<div>过敏史: <input v-model="add_data.allergy" type="text"></div>'+
                '<div>*监护人: <input v-model="add_data.parentName" type="text"></div>'+
                '<div>*监护人关系: <public-parentRelation @giveParentRelation="getParentRelation"></public-parentRelation></div>'+
                '<div>*监护人手机号: <input v-model="add_data.phoneNumber" type="text"></div>'+
                '<div>监护人详细地址: <input v-model="add_data.address" type="text"></div>'+
                '<div class="postData"><input @click="addData" class="save" type="button" value="保存"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                name:'',
                gradeId:null,
                classId:null,
                personCount: 0,
                pageCount:1,
                pageNo:1,
                show_current: '宝宝列表',
                recompose_baby:false,
                responseData:[],
                detail_data: null,
                add_data:{ //添加宝宝时填写的数据
                    token: token,
                    babyName: '',
                    cardId: '',
                    birthday: 0,
                    height: '',
                    health: '',
                    hobby: '',
                    specialty: '',
                    classId: null,
                    allergy: '',
                    weight: '',
                    sex: null,
                    parentName: '',
                    phoneNumber: '',
                    address: '',
                    identity: ''
                },
                tableTitle: ['姓名', '性别','年级', '班级','隐藏', '操作'],
                tableItem: [],
                mustFill:['babyName','classId','parentName','phoneNumber']
            }
        },
        computed:{
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/babyMessage.do',
                    data: {
                        token: token,
                        name: this.name,
                        gradeId: this.gradeId,
                        classId: this.classId,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(!data.state) return;
                        self.personCount = data.count;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;

                        self.responseData.forEach(function(item,index,arr){
                            $.ajax({
                                url: baseUrl + '/getOldClassByBabyId.do?',
                                data: {
                                    babyId: item.babyId
                                },
                                type: 'post',
                                success: function(data){
                                    arr[index].originClass = data.info;
                                }
                            });
                        });

                        self.tableItem = self.responseData.map(function (item) {
                            return {
                                name: item.babyName,
                                sex: item.sex == 0 ? '男' : '女',
                                grade: item.leadGrade,
                                class: item.leadClass,
                                operation: {
                                    type: '宝宝',
                                    action: ['查看/修改','删除']
                                }
                            } 
                        });
                    }
                }
            }
        },
        watch: {
            xhr:function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getPageNo: Vue.prototype.$getPageNo,
            getBirthday_add: function (timestamp) {
                this.add_data.birthday = timestamp;
            },
            getClassId_add: function ($event) {
                this.add_data.classId = $event[1];
            },
            getClassId_alter: function ($event) {
                this.detail_data.classId = $event[1];
            },
            getBirthday_alter: function (timestamp) {
                this.detail_data.birthday = timestamp;
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value){
                    case '查看/修改':
                        this.recompose_baby = true;
                        break;
                    case '删除':
                    confirm('是否确认删除')&&
                        $.ajax({
                            url: baseUrl + '/deleteBaby.do',
                            data: {
                                token: token,
                                babyId: self.detail_data.babyId
                            },
                            type: 'post',
                            success: function (data) {
                                if(!data.state) return;
                                $.ajax(self.xhr);
                                alert('删除成功');
                            }
                        });
                    break;
                }
            },
            getParentRelation: function (relation) {
                this.add_data.identity = relation[0];
            },
            addData: function () {
                var self = this;
                if(this.$isNotFilled(this.add_data,this.mustFill)) return;
                if(!this.add_data.identity){
                    alert('未选择家长关系');
                    return;
                }
                if(this.add_data.cardId && !Vue.prototype.$identity(this.add_data.cardId)) return;
                var reg = /^\d{1,3}$/;
                if(this.add_data.height || this.add_data.weight){
                    if(!(reg.exec(this.add_data.height) && reg.exec(this.add_data.weight))){
                        alert('身高或体重填写不正确,请填写正确的数字，如30');
                        return;
                    }
                }
                loader.show = true;
                $.ajax({
                    url: baseUrl + '/addBaby.do',
                    data: self.add_data,
                    type: 'post',
                    success: function (data) {
                        loader.show = false;
                        switch(data.state){
                            case 0: return;
                            case 1:
                                $.ajax(self.xhr);
                                alert('宝宝注册成功');
                                self.show_current = '宝宝列表';
                                break;
                            case 3:
                                alert('身份证号重复');
                                break;
                        }
                    },
                    error: function () {
                        loader.show = false;
                    }
                });
            },
            getParentId: function (parentId) {
                  this.detail_data.parentId = parentId;
            },
            alterData: function () {
                var self = this;
                var detail_data = this.detail_data;
                detail_data.token = token;
                if(this.$isNotFilled(detail_data,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/updateBaby.do',
                    data: detail_data,
                    type: 'post',
                    success: function (data) {
                        if(!data.state) return;
                        switch(data.state){
                            case 0:
                                alert('修改失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                self.recompose_baby = false;
                                alert('修改成功');
                                break;
                        }
                    }
                })
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 家长管理
    var patriarchManage = Vue.component('patriarch',{
        template:
        '<div class="patriarchManage">' +
            '<div class="nav" @click="$showTab($event)">'+
                '<div :class="{current:show_current === '+"'家长列表'"+'}">家长列表</div>'+
                '<div :class="{current:show_current === '+"'家长添加'"+'}">家长添加</div>'+
            '</div>'+
            '<div class="patriarch-list" v-show="show_current === '+"'家长列表'"+'">' +
                '<div class="filter">'+
                    '姓名: <input v-model="name" class="name" type="text">'+
                    '手机号: <input v-model="phoneNumber" class="phoneNumber" type="text">'+
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
                    '<div v-show="personCount" class="inlineBlock">总人数: <span v-text="personCount"></span></div>'+
                '</div>'+
                '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
                '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                '<div class="look-Detaildata" v-if="recompose_patriarch">' +
                    '<h3>修改家长信息: </h3>'+
                    '<div>姓名: <input v-model="detail_data.parentInfo.parentName" type="text" value="" ></div>'+
                    '<div>手机号: <input v-model="detail_data.parentInfo.phoneNumber" type="text" value=""></div>'+
                    '<div>详细地址: <input v-model="detail_data.parentInfo.address" type="text" value=""> </div>'+
                    '<h3>宝宝信息: </h3>'+
                    '<public-table :title="tableTitle_babys" :item="tableItem_babys"></public-table>'+
                    '<div><input type="button" @click="addBaby($event)" name="alter" class="btn" value="添加宝宝"><input style="margin-left: 10px" type="button" name="alter" @click="deleteBaby($event)" class="btn" value="删除宝宝"></div>'+
                    '<div v-for="(baby,index) in detail_data.parentInfo.babyInfo">*宝宝: <public-gradeAndClass @giveGradeAndClass="getBabyId_alter($event)" :index="index" :showBaby="true"></public-gradeAndClass>家长与宝宝的关系: <public-parentRelation :index="index" @giveParentRelation="getParentRelation_alter"></public-parentRelation></div>'+ //<input v-model="detail_data.parentInfo.babyInfo[index].identity" type="text">
                    '<div class="postData"><input @click="alterData" class="save" type="button" value="修改">&nbsp&nbsp&nbsp&nbsp<input @click="recompose_patriarch=false" class="clear" type="button" value="取消"></div>'+
                '</div>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current==='+"'家长添加'"+'">' +
                '<h3>*家长添加(确保已添加班级、宝宝)</h3>'+
                '<div>*姓名: <input v-model="add_data.parentName" type="text"></div>'+
                '<div>*手机号: <input v-model="add_data.phoneNumber" type="text"></div>'+
                '<div>详细地址: <input v-model="add_data.address" type="text"></div>'+
                '<div><input type="button" @click="addBaby($event)" name="add" class="btn" value="添加宝宝"><input style="margin-left: 10px" type="button" name="add" @click="deleteBaby($event)" class="btn" value="删除宝宝"></div>'+
                '<div v-for="(baby,index) in add_data.babyInfo">*宝宝: <public-gradeAndClass v-on:giveGradeAndClass="getBabyId_add($event)" :index="index" :showBaby="true"></public-gradeAndClass>家长与宝宝的关系: <public-parentRelation :index="index" @giveParentRelation="getParentRelation_add"></public-parentRelation></div>'+ // <input v-model="add_data.babyInfo[index].identity" type="text">
                '<div class="postData"><input @click="addData" class="save" type="button" value="保存"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                name:'',
                phoneNumber:'',
                personCount: 0,
                pageNo:1,
                attendanceState: 3, //默认3，3为全部开通状态
                monitorState: 3, //默认3，
                pageCount:1,
                show_current: '家长列表',
                recompose_patriarch:false,
                responseData:[],
                detail_data: null,
                add_data: { //添加家长所填信息
                    token: token,
                    parentName: '',
                    phoneNumber: '',
                    address: '',
                    babyInfo:[
                        {
                            babyId: null,
                            identity: '',
                        }
                    ],
                },
                alter_data: {
                    token: token,
                    parentId: null,
                    parentName: 0,
                    address: '',
                },
                tableTitle: ['姓名', '手机号', '视频功能', '考勤功能','隐藏','操作'],
                tableItem: [],
                tableTitle_babys:['姓名', '性别', '年级', '班级', '视频到期日期', '考勤到期日期'],
                tableItem_babys:[]
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/parentMessage.do',
                    data: {
                        token: token,
                        name: this.name,
                        phoneNumber: this.phoneNumber,
                        attendanceState: this.attendanceState,
                        monitorState: this.monitorState,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.personCount = data.count;
                        self.pageCount = data.pageCount;
                        self.responseData = data.info;
                        self.tableItem = self.responseData.map(function (item) {
                            return {
                                name: item.parentInfo.parentName,
                                phoneNumber: item.parentInfo.phoneNumber,
                                monitorState: self.$isDredge(item.parentInfo.monitorTime),
                                attendanceState: self.$isDredge(item.parentInfo.attendanceTime),
                                operation: {
                                    action: ['查看/修改','删除']
                                }
                            }
                        });
                    }
                };
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getOperation:function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value){
                    case '查看/修改':
                        Vue.set(this.detail_data.parentInfo,'babyInfo',[]);//用于存放  新增宝宝关联
                        this.tableItem_babys = this.detail_data.classManageBigs.map(function (item) {
                            return {
                                name: item.babyName,
                                sex: item.sex === 0 ? '男' : '女',
                                Grade: item.leadGrade,
                                Class: item.leadClass,
                                monitorTime: self.$expirationDate(item.monitorTime),
                                attendanceTime: self.$expirationDate(item.attendanceTime)
                            }
                        });
                        this.recompose_patriarch = true;
                        break;
                    case '删除':
                        confirm('是否确认删除家长')&&
                            $.ajax({
                                url: baseUrl + '/deleteParent.do',
                                data: {
                                    token: token,
                                    parentId: this.detail_data.parentInfo.parentId
                                },
                                type: 'post',
                                success: function (data) {
                                    switch(data.state){
                                        case 0:
                                            alert('删除失败');
                                            break;
                                        case 1:
                                            $.ajax(self.xhr);
                                            alert('删除成功');
                                            break;
                                        case 2:
                                            alert('删除失败,该家长为宝宝的主监护人,请先修改宝宝的主监护人');
                                            break;
                                    }
                                }
                            })
                        break;
                }
            },
            addBaby: function (e) { //家长添加、修改中的宝宝数量
                switch(e.target.name){
                    case 'add':
                        var babyInfo =  this.add_data.babyInfo;
                        break;
                    case 'alter':
                        var babyInfo = this.detail_data.parentInfo.babyInfo;
                        break;
                }
                var baby = {
                    babyId: null,
                    identity: '',
                }
                babyInfo.splice(babyInfo.length,0,baby);
            },
            deleteBaby: function (e) {
                switch(e.target.name){
                    case 'add':
                        var babyInfo =  this.add_data.babyInfo;
                        if(babyInfo.length === 1){
                            alert('每个家长至少有一个宝宝');
                            return;
                        }
                        break;
                    case 'alter':
                        var babyInfo =  this.detail_data.parentInfo.babyInfo;
                        if(!babyInfo.length) return;
                        break;
                }
                babyInfo.splice(babyInfo.length - 1, 1);
            },
            getBabyId_add: function ($event) { //添加家长时候 添加宝宝的宝宝id
                this.add_data.babyInfo[$event[3]].babyId = $event[2];
            },
            getBabyId_alter: function ($event) {
                this.detail_data.parentInfo.babyInfo[$event[3]].babyId = $event[2];
            },
            babyInfoIsFilled: function (babyInfo) {
                for( var i = 0, len = babyInfo.length; i < len; i++){
                    for ( var k in babyInfo[i]){
                        if( !babyInfo[i][k] ){
                            alert('宝宝信息不完整,请填写完整');
                            return true;
                        }
                    }
                }
                return false;
            },
            getParentRelation_add: function ($event) {
                this.add_data.babyInfo[$event[1]].identity = $event[0];
            },
            getParentRelation_alter: function ($event) {
                this.detail_data.parentInfo.babyInfo[$event[1]].identity = $event[0];
            },
            addData: function () {
                var self = this,
                    babyInfo =  this.add_data.babyInfo,
                    babyId = [],
                    identity = [];
                if(this.$isNotFilled(this.add_data)) return;
                if(this.babyInfoIsFilled(babyInfo)) return;
                babyInfo.forEach(function (item,index) {
                     babyId[index] = item.babyId;
                     identity[index] = item.identity;
                });
                if(this.$isRepeatArr(babyId)) {
                    alert('添加的宝宝不能重复');
                    return;
                }
                this.add_data.babyId = babyId;
                this.add_data.identity = identity;
                loader.show = true;
                $.ajax({
                    url: baseUrl + '/addParent.do',
                    data: self.add_data,
                    type: 'post',
                    traditional: true,
                    success: function (data) {
                        loader.show = false;
                        switch(data.state){
                            case 0:
                                return;
                            case 1:
                                $.ajax(self.xhr);
                                self.show_current = '家长列表';
                                alert('添加成功');
                                break;
                            case 2:
                                alert('该手机号已注册');
                        }
                    },
                    error: function () {
                        loader.show = false;
                    }
                });
            },
            alterData: function () {
                var self = this,
                    parentInfo = this.detail_data.parentInfo, //家长信息
                    existed_babyInfo = this.detail_data.classManageBigs,//已存在的宝宝信息
                    babyInfo = parentInfo.babyInfo,//要添加的宝宝信息
                    babyId = [], //添加时候需要做处理上传
                    identity = [];
                babyInfo.forEach(function (item,index) {
                    babyId[index] = item.babyId;
                    identity[index] = item.identity;
                });
                var alter_data = {
                    token: token,
                    parentId: parentInfo.parentId,
                    parentName: parentInfo.parentName,
                    phoneNumber: parentInfo.phoneNumber,
                    address: parentInfo.address,
                    babyId: babyId,
                    identity: identity
                };
                if(this.$isNotFilled(alter_data)) return;
                if(this.babyInfoIsFilled(babyInfo)) return;
                if(this.$isRepeatArr(babyId)) {
                    alert('添加的宝宝不能重复');
                    return;
                }
                var existedBabyId = [];
                existed_babyInfo.forEach(function (item,index) {
                     existedBabyId[index] = item.babyId;
                });
                if(this.$isRepeatArr(babyId.concat(existedBabyId))){
                    alert('添加的宝宝已存在');
                    return;
                }
                    $.ajax({
                        url: baseUrl + '/updateParent.do',
                        data: alter_data,
                        type: 'post',
                        success: function (data) {
                            switch(data.state){
                                case 1:
                                    $.ajax(self.xhr);
                                    alert('修改成功');
                                    self.recompose_patriarch = false;
                                    break;
                                case 2:
                                    alert('该手机号已被注册');
                                    break;
                            }
                        },
                        traditional: true
                    });
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 推送消息
    var pushInfo = Vue.component('info-push',{
        template:
        '<div class="pushInfo">' +
        '<div class="filter">' +
        '<public-gradeAndClass @giveGradeAndClass="getGradeAndClass($event)"></public-gradeAndClass>'+
        '<select v-model="pushInfo_data.type">' +
        '<option :value="0">全部</option>'+
        '<option :value="2">家长</option>'+
        '<option :value="3">老师</option>'+
        '</select>'+
        '</div>'+
        '<div class="pushInfo-info">' +
        '<div><span>主题</span><input v-model="pushInfo_data.title" type="text" class="pushInfo-info-title" placeholder="标题"></div>'+
        '<div class="pushInfo-info-main"><span>正文</span><textarea v-model="pushInfo_data.content" placeholder="您要推送的消息"></textarea></div>'+
        '<input @click="pushInfo" class="btn" type="button" value="推送消息">'+
        '</div>'+
        '</div>',
        data: function () {
            return {
                pushInfo_data:{
                    token: token,
                    type: 0,
                    title: '',
                    content: '',
                    gradeId:null,
                    classId:null,
                }
            }
        },
        methods:{
            getGradeAndClass: function ($event) {
                this.pushInfo_data.gradeId = $event[0];
                this.pushInfo_data.classId = $event[1];
            },
            pushInfo: function () {
                var self = this;
                confirm('是否确认发送消息')&&
                $.ajax({
                    url: baseUrl + '/sendNotified.do',
                    data: self.pushInfo_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state === 1){
                            alert('发送成功');
                        }else{
                            alert('发送失败');
                        }
                    }
                });
            }
        }
    });
    // 消息历史
    var infoHistory = Vue.component('info-history',{
        template:
        '<div class="infoHistory">' +
            '<div class="filter">' +
                '开始日期: <public-date v-on:giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                '结束日期: <public-date v-on:giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
            '</div>'+
            '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length" v-on:giveOperation="getOperation"></public-table>'+
            '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
            '<div class="look-Detaildata" v-if="showInfo">'+
                '<h3>通知详情: </h3>'+
                '<textarea disabled>{{detail_data.message}}</textarea>'+
                '<div class="look"><input @click="showInfo=false" class="clear" type="button" value="关闭"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                startTime: 0,
                endTime: 0,
                pageNo: 1,
                pageCount: 1,
                showInfo: false,
                responseData: [],
                detail_data: null,
                tableTitle: ['通知发送时间','通知接收对象','标题','内容','隐藏','操作'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/messagelog.do',
                    data: {
                        token: token,
                        start: self.startTime,
                        end: self.endTime,
                        pageNo: self.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(!data.state) return;
                        var tableItem = [];
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.responseData.forEach(function (item,index) {
                            var info = {
                                time: self.$formatDate(item.registTime),
                                targetName: item.targetName,
                                title: item.title,
                                message: item.message,
                                operation: {
                                    action:['查看','删除']
                                }
                            }
                            tableItem[index] = info;
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
            getOperation:function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看':
                        this.showInfo = true;
                        break;
                    case '删除':
                        confirm('是否确认删除')&&
                        $.ajax({
                            url: baseUrl + '/deleteMessage.do',
                            data: {
                                token: token,
                                messageId: self.detail_data.messageId
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
        }
    });
    // 申请发送短信(老师专用)
    var applyPushInfo = Vue.component('info-push',{
        template:
        '<div>' +
            '<div @click="$showTab($event)" class="nav">' +
                '<div :class="{current: show_current == '+"'申请发送通知'"+'}">申请发送通知</div>'+
                '<div :class="{current: show_current == '+"'申请发送通知列表'"+'}">申请发送通知列表</div>'+
            '</div>'+
            '<div class="add-Newdata" v-show="show_current == '+"'申请发送通知'"+'">' +
                '<h3>申请发送通知</h3>'+
                '<div>通知接受对象: <public-teacherClass @giveTeacherClass="$getTeacherClass($event)"></public-teacherClass></div>'+
                '<div>通知标题: <input v-model="add_data.title" type="text"></div>'+
                '<div>通知内容: <textarea v-model="add_data.info"></textarea></div>'+
                '<div class="postData">' +
                    '<input @click="addMessage" class="save" type="button" value="提交">'+
                '</div>'+
                '</div>'+
                '<div v-show="show_current == '+"'申请发送通知列表'"+'">' +
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
                '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_current: '申请发送通知列表',
                add_data:{ //申请发送通知的数据
                    token: token,
                },
                pageCount: 1,
                pageNo: 1,
                responseData: [],
                detail_data: null,
                tableTitle: ['所发班级','标题','内容','申请时间','申请状态','隐藏','备注'],
                tableItem: [],
                classIds: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/applyMessageList.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo,
                    },
                    type: 'post',
                    success: function (data) {
                        if (data.state) {
                            var tableItem = [];
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.responseData.forEach(function (item, index) {
                                var message = {
                                    className: item.gartenClass.leadGrade + item.gartenClass.leadClass,
                                    title: item.title,
                                    info: item.info,
                                    registTime: self.$formatDate(item.registTime,true),
                                    state: item.state == 1 ? '未通过': '已通过',
                                    operation: {
                                        action: ['取消申请']
                                    }
                                }
                                tableItem[index] = message;
                            });
                            self.tableItem = tableItem;
                        }
                    }
                };
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
            addMessage: function () {
                var self = this;
                this.add_data.classIds = this.classIds;
                $.ajax({
                    url: baseUrl + '/applySendMessage.do',
                    data: this.add_data,
                    type: 'post',
                    traditional: true,
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('提交成功');
                            self.show_current = '申请发送通知列表';
                        }
                    },
                    error: function () {
                        alert('提交失败');
                    }
                });
            },
            getOperation: function (index,value) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '取消申请':
                        confirm('是否取消申请') &&
                        $.ajax({
                            url: baseUrl + '/cancelApplyMessage.do',
                            data: {
                                token: token,
                                messageId: this.detail_data.messageId
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state){
                                    $.ajax(self.xhr);
                                    alert('取消申请成功');
                                }
                            },error: function () {
                                alert('取消申请失败');
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
    // 短信审核
    var infoCheck = Vue.component('info-check',{
        template:
        '<div class="infoCheck">' +
            '<div class="nav">' +
                '<div class="current">老师短信群发申请列表</div>'+
            '</div>'+
            '<div class="filter">' +
                '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                '状态: ' +
                '<select v-model="state">' +
                    '<option :value="null">请选择</option>'+
                    '<option :value="1">未通过</option>'+
                    '<option :value="2">已通过</option>'+
                '</select>'+
            '</div>'+
            '<div>' +
                '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                '<div v-if="show_detail" class="look-Detaildata">' +
                    '<h3>短信申请内容:</h3>'+
                    '<div>老师姓名: <input disabled :value="detail_data.workerName" type="text"></div>'+
                    '<div>申请时间: <input disabled :value="$formatDate(detail_data.registTime)" type="text"></div>'+
                    '<div>申请状态: <input disabled :value="detail_data.state" type="text"></div>'+
                    '<div>标题: <input disabled :value="detail_data.title" type="text"></div>'+
                    '<div>内容: <textarea disabled :value="detail_data.info"></textarea></div>'+
                    '<div class="postData"><input @click="show_detail = false" type="button" class="clear" value="取消"></div>'+
                '</div>'+
                '<div class="reject add-Newdata" v-if="disposeData.show">'+
                    '<div>'+
                        '拒绝理由:'+
                        '<textarea v-model="disposeData.remark"></textarea>'+
                    '</div>'+
                    '<div class="postData">'+
                        '<input type="button" class="save" @click="disposeMessage" value="确定">'+
                        '<input type="button" class="clear" @click="disposeData.show = false" value="取消">'+
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
                tableTitle: ['老师姓名','申请时间','申请状态','所发班级','标题','内容','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                show_detail: false,
                disposeData: {
                    token: token,
                    messageId: null,
                    state: 0,
                    remark: '',
                    show: false
                }
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/teacherMessage.do',
                    data: {
                        token: token,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        pageNo: this.pageNo,
                        state: this.state
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            var tableItem = [];
                            self.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function(item){
                                return {
                                    workerName: item.workerName,
                                    registTime: self.$formatDate(item.registTime,true),
                                    state: item.state == 1 ? '未通过' : '已通过',
                                    className: item.gartenClass.leadGrade + item.gartenClass.leadClass,
                                    title: item.title,
                                    info: item.info,
                                    operation: {
                                        get action(){
                                            if(item.state == 1){
                                                return ['查看','同意','拒绝'];
                                            }else {
                                                return ['查看']
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
            disposeMessage: function(){
                $.ajax({
                    url: baseUrl + '/updateMessageApply.do',
                    data: this.disposeData,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            var str = '';
                            switch(this.disposeData.state){
                                case 2:
                                str = '同意';
                                break;
                                case 3:
                                str = '拒绝';
                            }
                            alert('已'+str+'老师发送短信');
                        }
                    }
                });
            },
            getOperation: function (index,value,type) {
                var self = this,state;
                this.detail_data = this.responseData[index];
                this.disposeData.messageId = this.detail_data.messageId;
                switch(value){
                    case '查看':
                        this.show_detail = true;
                        break;
                    case '同意':
                        this.disposeData.state = 2;
                        confirm('是否同意老师发送短信') &&
                        this.disposeMessage();
                        break;
                    case '拒绝':
                        this.disposeData.state = 3;
                        this.disposeData.show = true;
                        break;
                      
                }             
            }
        }
    });
    // 年级管理
    var gradeManage = Vue.component('grade-manage',{
        template:
            '<div>' +
                '<div @click="$showTab($event)" class="nav">' +
                    '<div :class="{current: show_current == '+"'年级列表'"+'}">年级列表</div>'+
                    '<div :class="{current: show_current == '+"'年级添加'"+'}">年级添加</div>'+
                '</div>'+
                '<div v-show="show_current == '+"'年级列表'"+'">' +
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                '</div>'+
                '<div class="add-Newdata" v-show="show_current == '+"'年级添加'"+'">' +
                    '<h3>添加年级</h3>'+
                    '<div>*年级名称: <input v-model="addGrade_data.leadGrade" type="text"></div>'+
                    '<div>*年级序号: <input v-model="addGrade_data.no" type="text"></div>'+
                    '<div>备注: <textarea v-model="addGrade_data.mark"></textarea></div>'+
                    '<div class="postData"><input type="button" @click="addGrade" class="save" value="确定"></div>'+
                '</div>'+
                '<div class="look-Detaildata" v-if="show_detail">' +
                    '<h3>查看/修改年级</h3>'+
                    '<div>*年级名称: <input v-model="detail_data.leadGrade" type="text"></div>'+
                    '<div>*年级序号: <input disabled :value="detail_data.no" type="text"></div>'+
                    '<div>备注: <textarea v-model="detail_data.mark"></textarea></div>'+
                    '<div class="postData">' +
                        '<input type="button" @click="updateGrade" class="save" value="保存">' +
                        '<input type="button" @click="show_detail=false" class="clear" value="取消">' +
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                show_current: '年级列表',
                tableTitle: ['年级序号','年级名称','注册日期','备注','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                show_detail: false,
                addGrade_data: {
                    token: token,
                    leadGrade: '',
                    mark: '',
                    no: ''
                },
                mustFill: ['leadGrade','no']
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findGartenGrade.do',
                    data: {
                        gartenId: gartenId
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.responseData = data.info;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    no: item.no,
                                    leadGrade: item.leadGrade,
                                    registTime: self.$formatDate(item.registTime),
                                    mark: item.mark,
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
        methods: {
            getOperation: function (index,value,type) {
                var self= this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value){
                    case '查看/修改':
                        this.show_detail = true;
                        break;
                    case '删除':
                        confirm('是否确认删除') &&
                            $.ajax({
                                url: baseUrl + '/deleteGartenGrade.do',
                                data: {
                                    token: token,
                                    gradeId: this.detail_data.gradeId
                                },
                                type: 'post',
                                success: function (data) {
                                    switch(data.state){
                                        case 1:
                                            $.ajax(self.xhr);
                                            alert('删除成功');
                                            break;
                                        case 3:
                                            alert('该年级下存在班级,删除失败');
                                            break;
                                    }
                                }
                            })
                        break;
                }
            },
            getTimes: Vue.prototype.$getTimes,
            addGrade: function () {
                var self = this;
                if(this.$isNotFilled(this.addGrade_data,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/addGartenGrade.do',
                    data: this.addGrade_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('添加失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                self.show_current = '年级列表';
                                alert('添加成功');
                                break;
                            case 4:
                                alert('年级名称或序号已存在');
                                break;
                        }
                    }
                });
            },
            updateGrade: function () {
                var self = this;
                this.detail_data.token = token;
                if(this.$isNotFilled(this.detail_data,this.mustFill)) return;
                $.ajax({
                    url: baseUrl + '/updateGartenGrade.do',
                    data: this.detail_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('修改失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                alert('修改成功');
                                self.show_detail = false;
                                break;
                            case 3:
                                alert('年级名字已存在');
                                break;
                        }
                    }
                })
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 班级管理
    var classManage = Vue.component('class-manage',{
        template:
            '<div>' +
                '<div @click="$showTab($event)" class="nav">' +
                    '<div :class="{current:show_current=='+"'班级列表'"+'}">班级列表</div>'+
                    '<div :class="{current:show_current=='+"'班级添加'"+'}">班级添加</div>'+
                '</div>'+
                '<div v-show="show_current == '+"'班级列表'"+'">' +
                    '<div class="filter">' +
                        '<public-gradeAndClass :hideClass="true" @giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>'+
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" ></public-table>' +
                '</div>'+
                '<div class="add-Newdata" v-show="show_current == '+"'班级添加'"+'">' +
                    '<h3>班级添加</h3>'+
                    '<div>选择年级: <public-gradeAndClass :hideClass="true" @giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass></div>'+
                    '<div>班级名称: <input type="text" v-model="addClass_data.leadClass"></div>'+
                    '<div>备注: <textarea v-model="addClass_data.mark"></textarea></div>'+
                    '<div class="postData"><input @click="addClass" type="button" class="save" value="确定"></div>'+
                '</div>'+
                '<div class="look-Detaildata" v-if="show_detail">' +
                    '<h3>班级修改</h3>'+
                    '<div>班级名称: <input v-model="detail_data.leadClass" type="text"></div>'+
                    '<div>所在年级: <public-gradeAndClass :_gradeId="detail_data.gradeId" @giveGradeAndClass="getGradeAndClass($event)" :hideClass="true"></public-gradeAndClass></div>'+
                    '<div>备注: <textarea v-model="detail_data.mark"></textarea></div>'+
                    '<div class="postData">' +
                        '<input @click="updateClass" type="button" class="save" value="确定">' +
                        '<input @click="show_detail=false" type="button" class="clear" value="取消">' +
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                show_current: '班级列表',
                gradeId: null,
                tableTitle: ['年级','班级','注册时间','备注','隐藏','操作'],
                tableItem: [],
                responseData: [],
                detail_data: null,
                addClass_data: {
                    token: token,
                    leadClass: '',
                    gradeId: null,
                    mark: '',
                },
                show_detail: false
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findGartenClass.do',
                    data: {
                        gartenId: gartenId,
                        gradeId: this.gradeId
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.responseData = data.info;
                            self.tableItem = data.info.map(function (item) {
                                return {
                                    leadGrade: item.leadGrade,
                                    leadClass: item.leadClass,
                                    registTime: self.$formatDate(item.registTime),
                                    mark: item.mark,
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
            },
            gradeId: function () {
                this.addClass_data.gradeId = this.gradeId;
            }
        },
        methods: {
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = JSON.parse(JSON.stringify(this.responseData[index]));
                switch(value){
                    case '查看/修改':
                        this.show_detail = true;
                        break;
                    case '删除':
                        confirm('是否确认删除')&&
                        $.ajax({
                            url: baseUrl + '/deleteGartenClass.do',
                            data: {
                                token: token,
                                classId: this.detail_data.classId
                            },
                            type: 'post',
                            success: function (data) {
                                switch(data.state){
                                    case 0:
                                        alert('删除失败');
                                        break;
                                    case 1:
                                        $.ajax(self.xhr);
                                        alert('删除成功');
                                        break;
                                    case 3:
                                        alert('该班级存在宝宝或老师,无法删除');
                                        break;
                                }
                            }
                        })
                        break;
                }
            },
            addClass: function () {
                var self = this;
                if(!this.addClass_data.gradeId){
                    alert('未选择年级');
                    return;
                }
                if(!this.addClass_data.leadClass){
                    alert('未填写班级名字');
                    return;
                }
                $.ajax({
                    url: baseUrl + '/addGartenClass.do',
                    data: this.addClass_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 0:
                                alert('添加失败');
                                break;
                            case 1:
                                $.ajax(self.xhr);
                                self.show_current = '班级列表';
                                alert('添加成功');
                                break;
                            case 3:
                                alert('添加的班级名称不能重复');
                                break;
                        }
                    },error: function () {
                    }
                })
            },
            getGradeAndClass: function ($event) {
                this.detail_data.gradeId = $event[0];
            },
            updateClass: function () {
                var self = this;
                this.detail_data.token = token,
                $.ajax({
                    url: baseUrl + '/updateGartenClass.do',
                    data: this.detail_data,
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
                            case 3:
                                alert('班级名字重复,无法修改');
                                break;
                        }
                    }
                })
            }
        },
        created: function () {
            $.ajax(this.xhr);
        }
    });
    // 升班管理
    var upGradeManage = Vue.component('upGrade-manage',{
        template:
            '<div>' +
                '<div @click="graduate"class="btn-skyblue">全园升班毕业</div>'+
            '</div>',
        methods: {
            graduate: function () {
                confirm('是否毕业')&&
                $.ajax({
                    url: baseUrl + '/graduation.do',
                    data: {
                        token: token
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            alert('全员升班毕业成功');
                        }
                    }
                });
            }
        }
    });
    // 考勤时间管理
    var attendanceTimeManage = Vue.component('attendanceTime-manage',{
        template:
        '<div class="attendanceTimeManage">' +
            '<div class="nav" @click="$showTab($event)">'+
                '<div :class="{current:show_current === '+"'打卡日期设置'"+'}">打卡日期设置</div>'+
                '<div :class="{current:show_current === '+"'打卡时间段设置'"+'}">打卡时间段设置</div>'+
            '</div>'+
            '<div class="checkTime" v-show="show_current==='+"'打卡日期设置'"+'">' +
                '<div class="filter">' +
                    '添加无需打卡的日期: <public-date v-on:giveTimes="getTimes"></public-date><input @click="addIgnoreTime" type="button" value="添加" class="save">' +
                '</div>'+
                '<public-table v-on:giveOperation="getOperation" :title="ignoreTime.tableTitle"  :item="ignoreTime.tableItem" :itemCount="16-ignoreTime.tableItem.length"></public-table>'+
                '<public-paging v-on:givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
            '</div>'+
            '<div v-if="checkTime_data" class="checkIn add-Newdata" v-show="show_current==='+"'打卡时间段设置'"+'">' +
                '<div class="filter">' +
                    '中午是否需要考勤:' +
                    '<select v-model="type">' +
                        '<option :value="1">是</option>'+
                        '<option :value="0">否</option>'+
                    '</select>'+
                '</div>'+
                '<div>' +
                    '上午入校结束时间: <check-time :_checkTime="checkTime_data.time1" @giveCheckTime="getCheckTime($event,'+"'time1'"+')"></check-time>'+
                '</div>'+
                '<div v-show="type">' +
                    '上午离校开始时间: <check-time :_checkTime="checkTime_data.time2" @giveCheckTime="getCheckTime($event,'+"'time2'"+')"></check-time>'+
                '</div>'+
                '<div v-show="type">' +
                    '上午离校结束时间: <check-time :_checkTime="checkTime_data.time3" @giveCheckTime="getCheckTime($event,'+"'time3'"+')"></check-time>'+
                '</div>'+
                '<div v-show="type">' +
                    '下午入校开始时间: <check-time :_checkTime="checkTime_data.time4" @giveCheckTime="getCheckTime($event,'+"'time4'"+')"></check-time>'+
                '</div>'+
                '<div v-show="type">' +
                    '下午入校结束时间: <check-time :_checkTime="checkTime_data.time5" @giveCheckTime="getCheckTime($event,'+"'time5'"+')"></check-time>'+
                '</div>'+
                '<div>' +
                    '下午离校开始时间: <check-time :_checkTime="checkTime_data.time6" @giveCheckTime="getCheckTime($event,'+"'time6'"+')"></check-time>'+
                '</div>'+
                '<div>非打卡时间段老师能否离园: ' +
                    '<select v-model="checkTime_data.teacherAttendanceFlag">' +
                            '<option :value="0">能</option>'+
                            '<option :value="1">不能</option>'+
                    '</select>'+
                '</div>' +
                '<div>非打卡时间段宝宝能否离园: ' +
                    '<select v-model="checkTime_data.studentAttendanceFlag">' +
                        '<option :value="0">能</option>'+
                        '<option :value="1">不能</option>'+
                    '</select>'+
                '</div>' +
                '<div class="postData"><input @click="updateCheckTime" class="save" type="button" value="保存"></div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                pageCount: 1,
                pageNo: 1,
                show_current: '打卡时间段设置',
                responseData: [],
                ignoreDate:'', //添加 不需要打卡的日期
                type: 0,
                checkTime_data: null,
                ignoreTime: {
                    tableTitle: ['无需打卡的日期', '隐藏', '操作'],
                    tableItem: []
                }
            };
        },
        components: {
            'check-time': {
                props: ['_checkTime'],
                template:
                '<div class="inlineBlock">' +
                    '<select v-model="hour">' +
                        '<option>00</option>'+
                        '<option v-for="n in 23">{{n < 10 ? "0" + n : n}}</option>'+
                    '</select>'+
                    ':&nbsp&nbsp'+
                    '<select v-model="minute">' +
                        '<option>00</option>'+
                        '<option v-for="n in 59">{{n < 10 ? "0" + n : n}}</option>'+
                    '</select>'+
                    '<p v-show="checkTime == '+"'00:00'"+'" class="inlineBlock mark">未设置</p>'+
                '</div>',
                data: function () {
                    return {
                        hour: '00',
                        minute: '00',
                    }
                },
                computed: {
                    checkTime: function () {
                        return this.hour + ':' + this.minute;
                    }
                },
                watch: {
                    checkTime: function () {
                        this.giveCheckTime();
                    }
                },
                methods: {
                    giveCheckTime: function () {
                        this.$emit('giveCheckTime',[this.checkTime]);
                    }
                },
                created: function () {
                    if(this._checkTime){
                        var arr = this._checkTime.split(':');
                        this.hour = arr[0];
                        this.minute = arr[1];
                    }
                }
            }
        },
        computed:{
            //获取打卡时间信息 早上下午打卡时间段 老师学生是否能离园
            xhr_checkTime: function () {
                var self = this;
                return {
                    url: baseUrl + '/getDakaTime.do',
                    data:{token:token},
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            if(data.info){
                                self.checkTime_data = data.info;
                            }else {
                                self.checkTime_data = {
                                    token: token,
                                    time1: '00:00',
                                    time2: '00:00',
                                    time3: '00:00',
                                    time4: '00:00',
                                    time5: '00:00',
                                    time6: '00:00',
                                    teacherAttendanceFlag: 0,
                                    studentAttendanceFlag: 0
                                }
                            }
                            if(self.checkTime_data.time2 != '00:00'){
                                self.type = 1;
                            }
                        }
                    }
                }
            },
            //获取忽略时间
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/getIgnoreTime.do',
                    data: {
                        token: token,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if (data.state !== 1) return;
                        var tableItem = [];
                        self.responseData = data.info.list;
                        self.pageCount = data.info.pageCount;
                        self.responseData.forEach(function ( item, index) {
                            var ignoreDate = {};
                            ignoreDate.time = self.$formatDate(item);
                            ignoreDate.operation = {
                                action: ['删除']
                            }
                            tableItem[index] = ignoreDate;
                        });
                        self.ignoreTime.tableItem = tableItem;
                    }
                }

            },
        },
        watch: {
            type: function () {
                if(this.type == 0){
                    this.checkTime_data.time2 = '00:00';
                    this.checkTime_data.time3 = '00:00';
                    this.checkTime_data.time4 = '00:00';
                    this.checkTime_data.time5 = '00:00';
                }
            }
        },
        methods: {
            getPageNo: Vue.prototype.$getPageNo,
            getTimes: function (timestamp) {
                this.ignoreDate = timestamp;
            },
            addIgnoreTime: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/addIgnoreTime.do',
                    data: {
                        token: token,
                        date: this.ignoreDate
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state === 1){
                            $.ajax(self.xhr);
                            alert('添加成功');
                        }else if(data.state === 2){
                            alert('该日期已存在,请勿重复添加');
                        }
                    },
                    error: function () {
                        alert('添加失败');
                    }
                });
            },
            getCheckTime: function ($event,prop) {
                this.checkTime_data[prop] = $event[0];
            },
            updateCheckTime: function () {
                var self = this;
                this.checkTime_data.token = token;
                $.ajax({
                    url: baseUrl + '/updateDakaTime.do',
                    data: this.checkTime_data,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('修改成功');
                        }else {
                            alert('修改失败');
                        }
                    },
                    error: function () {
                    }
                });
                // var self = this,
                //     reg_time = /^((1|0)\d|2[0-4]):[0-5]\d$/,
                //     checkTime_data = self.checkTime_data;
                // if(!
                //     ((reg_time.exec(checkTime_data.arriveStartTime))&&
                //     (reg_time.exec(checkTime_data.arriveEndTime))&&
                //     (reg_time.exec(checkTime_data.leaveStartTime))&&
                //     (reg_time.exec(checkTime_data.leaveEndTime)))
                // ){
                //     alert('时间段正确格式: 08:30');
                //     return;
                // }
                // var checkTime_data = JSON.parse(JSON.stringify(self.checkTime_data));
                // checkTime_data.teacherAttendanceFlag =  checkTime_data.teacherAttendanceFlag == true ? 0 : 1;
                // checkTime_data.studentAttendanceFlag =  checkTime_data.studentAttendanceFlag == true ? 0 : 1;
                // $.ajax({
                //     url: baseUrl + '/updateDakaTime.do',
                //     data: checkTime_data,
                //     type: 'post',
                //     success: function (data) {
                //         if(data.state){
                //             alert('修改成功');
                //         }else {
                //             alert('修改失败');
                //         }
                //     }
                // })
            },
            getOperation: function (index,value,type) {
                var self = this;
                switch(value){
                    case '删除':
                        $.ajax({
                            url: baseUrl + '/deleteIgnoreTime.do',
                            data: {
                                token: token,
                                date: self.responseData[index]
                            },
                            type: 'post',
                            success: function (data) {
                                if(data.state !== 1 ) return;
                                $.ajax(self.xhr);
                                alert('删除成功');
                            }
                        });
                }
            }
        },
        created: function () {
            $.ajax(this.xhr);
            $.ajax(this.xhr_checkTime);
        }
    });
    // 考勤卡管理
    var attendanceCardManage = Vue.component('attendanceCard-manage',{
        template:
        '<div class="attendanceCardManage">' +
            '<div class="nav" @click="$showTab($event)">'+
                '<div :class="{current:show_current === '+"'考勤卡管理'"+'}">考勤卡管理</div>'+
            '</div>'+
            '<div class="filter">' +
                '<select v-model="job">' +
                    '<option :value="null">类型</option>'+
                    '<option>宝宝</option>'+
                    '<option>老师</option>'+
                '</select>'+
                '<public-gradeAndClass v-on:giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>'+
                '<div @click="exportCard" class="btn-skyblue" >导出考勤卡</div>'+
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
                '<div>姓名*: <input type="text" :value="detail_data.name" disabled></div>'+
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
                tableItem: []
            };
        },
        computed: {
            filter_data: function () {
                return {
                    token: token,
                    job: this.job,
                    classId: this.classId,
                    pageNo: this.pageNo
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
            xhr: function () {
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
                    url: baseUrl + '/bindingCard.do',
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
                    url: baseUrl + '/cancelBinding.do',
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
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 打卡记录
    var attendanceHistory = Vue.component('attendanceHistory',{
        template:
            '<div>' +
                '<div class="nav">' +
                    '<div class="current">打卡记录</div>'+
                '</div>'+
                '<div>' +
                    '<div class="filter">' +
                        '开始日期: <public-date @giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                        '结束日期: <public-date @giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                        '类型:' +
                        '<select v-model="job">' +
                            '<option :value="null">未选择</option>'+
                            '<option>宝宝</option>'+
                            '<option>老师</option>'+
                        '</select> '+
                        '姓名: <input v-model="jobName" type="text">' +
                    '</div>'+
                    '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                    '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
                    '<div v-if="show_detail" class="look-Detaildata">' +
                        '<img :src="detail_data.imgUrl" style="width:80%" alt="出入园图片">'+
                        '<div class="postData"><input class="clear" @click="show_detail=false"  value="关闭" type="button"></div>'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                startTime: 0,
                endTime: 0,
                job: null,
                jobName: '',
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['姓名','类型','打卡时间','隐藏','操作'],
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
                    url: baseUrl + '/findDakalog.do',
                    data: {
                        token: token,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        job: this.job,
                        jobName: this.jobName,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.pageCount;
                            self.responseData = data.info;
                            self.tableItem = self.responseData.map(function (item) {
                                return {
                                    name: item.name,
                                    job: item.job,
                                    attendanceTime: self.$formatDate(item.attendanceTime,true),
                                    operation: {
                                        action: ['查看出入园图片']
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
                    case '查看出入园图片':
                        this.show_detail = true;
                        break;
                }
            },
        }
    });
    // 考勤异常
    var attendanceAnomalyManage = Vue.component('attendance-anomaly',{
        template:
        '<div class="attendanceAnomalyManage">' +
            '<div class="filter">' +
                '开始日期: <public-date v-on:giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                '结束日期: <public-date v-on:giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                '类型: '+
                '<select v-model="type">' +
                    '<option :value="null">全部</option>'+
                    '<option :value="0">宝宝</option>'+
                    '<option :value="1">老师</option>'+
                '</select>'+
                '是否处理: '+
                '<select v-model="state">' +
                    '<option :value="0">未处理</option>'+
                    '<option :value="1">异常</option>'+
                    '<option :value="2">无效异常</option>'+
                '</select>'+
            '</div>'+
            '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
            '<div v-if="show_detail" class="look-Detaildata">' +
                '<h3>处理异常</h3>'+
                '<img :src="detail_data.unusualImg" style="width:75%;" alt="异常图片">'+
                '<div>异常处理: ' +
                '<select v-model="exceptions_state">' +
                    '<option :value="null">请选择</option>'+
                    '<option :value="1">有效异常</option>'+
                    '<option :value="2">无效异常</option>'+
                '</select>'+
                '</div>'+
                '<div class="postData">' +
                    '<input type="button" class="save" @click="HandlingExceptions" value="确定">'+
                    '<input type="button" class="clear" @click="show_detail=false" value="取消">'+
                '</div>'+
            '</div>'+
        '</div>',
        data:function () {
            return {
                startTime: 0,
                endTime: 0,
                type: null,
                state: 0,
                pageNo: 1,
                pageCount: 1,
                responseData: null,
                detail_data: null,
                tableTitle: ['姓名','类型','异常时间','异常类型','是否处理','隐藏','操作'],
                tableItem: [],
                show_detail: false,
                exceptions_state: null,
            }
        },
        computed:{
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/yichang.do',
                    data: {
                        token: token,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        type: this.type,
                        state: this.state,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount;
                        self.responseData = data.info.list;
                        self.tableItem = self.responseData.map(function (item,index) {
                            return {
                                name: item.jobName,
                                type: item.job,
                                anomalyTime: self.$formatDate(item.unusualTime,true),
                                get unusualType(){
                                    switch (item.unusualType){
                                        case 5:
                                            return '上午迟到';
                                        case 6:
                                            return '上午早退';
                                        case 7:
                                            return '下午迟到';
                                        case 8:
                                            return '下午早退';
                                        case 9:
                                            return '下午提前入园';
                                        case 10:
                                            return '下午推迟离园';
                                    }
                                },
                                get state() {
                                    switch(item.state){
                                        case 0:
                                            return '未处理';
                                        case 1:
                                            return '异常';
                                        case 2:
                                            return '无效异常';
                                    }
                                },
                                operation: {
                                    action: ['处理异常']
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
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '处理异常':
                        this.show_detail = true;
                        break;
                }
            },
            HandlingExceptions: function () {
                var self = this;
                if(!this.exceptions_state){
                    alert('请选择异常状态');
                    return;
                }
                $.ajax({
                    url: baseUrl + '/yichangResolve.do',
                    data: {
                        unusualId: this.detail_data.unusualId,
                        state: this.exceptions_state
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            self.show_detail = false;
                            alert('处理成功');
                        }
                    }
                })
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 请假管理
    var leaveManage = Vue.component('leave-manage',{
       template:
       '<div class="leaveManage">' +
            '<div class="filter">' +
                // '<public-gradeAndClass></public-gradeAndClass>'+
                '开始日期: <public-date v-on:giveTimes="getStartTime"></public-date>'+
                '结束日期: <public-date v-on:giveTimes="getEndTime"></public-date>'+
                '类型:'+
                '<select v-model="type">' +
                    '<option :value="0">宝宝</option>'+
                    '<option :value="1">老师</option>'+
                '</select>'+
                '是否处理:'+
                '<select v-model="state">' +
                    '<option :value="null">请选择</option>'+
                    '<option :value="0">未处理</option>'+
                    '<option :value="1">已处理</option>'+
                '</select>'+
            '</div>'+
            '<public-table :title="current.tableTitle" :item="current.tableItem" :itemCount="16-current.tableItem.length"></public-table>'+
            '<public-paging :pageCount=pageCount v-on:givePageNo="getPageNo"></public-paging>'+
       '</div>',
        data:function () {
            return {
                startTime: 0,
                endTime: 0,
                pageNo: 1,
                pageCount: 1,
                type: 0,
                state: null,
                baby: {
                    tableTitle: ['宝宝姓名', '申请时间', '请假时间', '请假理由', '假条状态'],
                    tableItem: []
                },
                teacher: {
                    tableTitle: ['老师姓名', '申请时间', '请假时间', '请假理由', '假条状态'],
                    tableItem: []
                }
            }
        },
        computed:{
           current: function () {
             switch(this.type){
                 case 0:
                     return this.baby;
                 case 1:
                     return this.teacher;
             }
           },
           xhr: function () {
               var self = this;
                   return {
                       url: baseUrl + '/leave.do',
                       data:{
                           token: token,
                           startTime: this.startTime,
                           endTime: this.endTime,
                           type: this.type,
                           state: this.state,
                           pageNo: this.pageNo
                       },
                       type: 'post',
                       success: function (data) {
                           if(data.state !==1) return;
                           self.pageCount = data.info.pageCount;
                           switch(self.type){
                               case 0:
                                   self.baby.tableItem = data.info.list.map(function (item,index) {
                                       return {
                                           name: item.babyName,
                                           applyTime: self.$formatDate(item.time,true),
                                           leaveTime: self.$formatDate(item.leaveTime,true) + ' - ' + self.$formatDate(item.endTime,true),
                                           leaveReason: item.reason,
                                           leaveState: item.leaveState == 0 ? '未处理' : '已处理'
                                       }
                                   });
                                   break;
                               case 1:
                                   self.teacher.tableItem = data.info.list.map(function (item,index) {
                                       return {
                                           name: item.workerName,
                                           applyTime: self.$formatDate(item.applicationTime,true),
                                           leaveTime: self.$formatDate(item.leaveTime,true) + ' - ' + self.$formatDate(item.endTime,true),
                                           leaveReason: item.leaveReason,
                                           leaveState: item.leaveState == 0 ? '未处理' : '已处理'
                                       }
                                   });
                                   break;
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
            getStartTime: function (timestamp) {
                this.startTime = timestamp;
            },
            getEndTime: function (timestamp) {
                this.endTime = timestamp;
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 晨检查看
    var morningCheckLook = Vue.component('morning-look',{
        template:
        '<div class="morningCheckInput">' +
            '<div class="filter">' +
                '<public-date v-on:giveTimes="getTimes"></public-date>' +
                '<public-gradeAndClass v-on:giveGradeAndClass="$getGradeAndClass($event)"></public-gradeAndClass>' +
            '</div>'+
            '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging v-on:givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
        '</div>',
        data:function () {
            return {
                classId: null,
                timestamp: 0,
                pageNo: 1,
                pageCount: 1,
                tableTitle: ['日期', '年级', '班级', '宝宝姓名', '体温'],
                tableItem: []
            };
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/classCheck.do',
                    data: {
                        token: token,
                        time: this.timestamp,
                        classId: this.classId,
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state !== 1) return;
                        self.pageCount = data.info.pageCount
                        self.tableItem = data.info.list.map(function (item,index) {
                            return {
                                date: self.$formatDate(item.time),
                                grade: item. leadClass,
                                class: item. leadGrade,
                                name: item.babyName,
                                heat: item.temperature == 0 ? '未晨检' : item.temperature + '℃'
                            }
                        });
                    }
                }
            }
        },
        watch: {
            xhr:function () {
                $.ajax(this.xhr);
            }
        },
        methods:{
            getTimes: function (timestamp) {
                this.timestamp = timestamp;
            },
            getPageNo: Vue.prototype.$getPageNo,
        }
    });
    // 课程管理
    var curriculumManage = Vue.component('curriculum-manage',{
       template:
       '<div class="curriculumManage">' +
            '<div class="nav" @click="showTab($event)">' +
                '<div :class="{current:show_current==='+"'课程列表'"+'}">课程列表</div>'+
                '<div :class="{current:show_current==='+"'课程添加'"+'}">课程添加</div>'+
            '</div>'+
            '<div class="filter">' +
                '<strong>选择日期(必选): </strong><public-date v-on:giveTimes="getTimes"></public-date>'+
                '<strong>选择年级、班级(必选): </strong><public-gradeAndClass v-on:giveGradeAndClass="getGradeAndClass"></public-gradeAndClass>'+
                '<div @click="pushInfo" class="btn-skyblue">推送通知</div>' +
            '</div>'+
            '<div v-show="show_current==='+"'课程列表'"+'">'+
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '</div>'+
            '<div v-show="show_current==='+"'课程添加'"+'">' +
                '<div><input type="button" class="btn" value="添加课程" @click="addCourse"></div>'+
                '<table class="course">'+
                    '<thead>'+
                        '<tr>'+
                            '<th>日期</th>'+
                            '<th>年级</th>'+
                            '<th>班级</th>'+
                            '<th>上午/下午</th>'+
                            '<th>时间段(如“08:30”)</th>'+
                            '<th>课程名称</th>'+
                            '<th>操作</th>'+
                        '</tr>'+
                    '</thead>'+
                    '<tbody>' +
                        '<tr v-for="(course,index) in add_data">' +
                            '<td>{{$formatDate(course.time)}}</td>'+
                            '<td>{{gradeName}}</td>'+
                            '<td>{{className}}</td>'+
                            '<td><input type="text" v-model="course._ampm"></td>'+
                            '<td><input type="text" v-model="course.startTime"> - <input type="text" v-model="course.endTime"></td>'+
                            '<td><input type="text" v-model="course.lessonName"></td>'+
                            '<td><span @click="deleteCourse(index)">删除</span></td>'+
                        '</tr>'+
                    '</tbody>'+
                '</table>'+
                '<div class="postData"><input @click="addData" type="button" class="save" value="提交"></div>'+
            '</div>'+
       '</div>',
        data:function () {
            return {
                show_current: '课程列表',
                date: 0,
                gradeName: null,
                className: null,
                classId: null,
                responseData: [],
                detail_data: null,
                add_data:[
                    // {
                    //     token: token,
                    //     time: this.date,
                    //     _ampm: '',
                    //     get ampm(){
                    //         switch(this._ampm){
                    //             case '上午':
                    //                 return 0;
                    //             case '下午':
                    //                 return 1;
                    //         }
                    //     },
                    //     startTime: '',
                    //     endTime: '',
                    //     classId: this.classId,
                    //     lessonName: '',
                    // }
                    this.oneCourse()
                ],
                responseData:[],
                tableTitle:['日期','年级','班级','上午/下午','时间段','课程名称','隐藏','操作'],
                tableItem:[],
            }
        },
        computed:{
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/lesson.do',
                    data: {
                        token: token,
                        time: self.date,
                        classId: self.classId,
                    },
                    type: 'post',
                    success: function (data) {
                        if(!data.state) return;
                        self.responseData = data.info;
                        self.tableItem = self.responseData.map(function (item,index) {
                            return {
                                date: self.$formatDate(item.time),
                                Grade: item.leadGrade,
                                Class: item.leadClass,
                                ampm: item.ampm === 0 ? '上午' : '下午',
                                time: item.startTime + '-' + item.endTime,
                                courseName: item.lessonName,
                                operation: {
                                    action: ['删除']
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
        methods:{
            showTab:function (e) {
               var target = e.target.innerHTML;
               if(target !== '课程列表' && target !== '课程添加') return;
               this.show_current = target;
            },
            getTimes:function (timestamp) {
                this.date = timestamp;
                if(this.add_data.length !== 0){
                    this.changeAddDataInfo();
                }
            },
            getGradeAndClass:function ($event) {
                this.gradeId = $event[0];
                this.classId = $event[1];
                this.gradeName = $event[4];
                this.className = $event[5];
                this.changeAddDataInfo();
            },
            changeAddDataInfo: function () {
                //填写中途时 更换时间或班级 更新数据
                var self = this;
                this.add_data.forEach(function (item,index) {
                    item.time = self.date;
                    item.classId = self.classId;
                });
            },
            oneCourse: function(){
                return {
                    token: token,
                    time: this.date,
                    _ampm: '',
                    get ampm(){
                        switch(this._ampm){
                            case '上午':
                                return 0;
                            case '下午':
                                return 1;
                        }
                    },
                    startTime: '',
                    endTime: '',
                    classId: this.classId,
                    lessonName: '',
                }
            },
            addCourse: function () {
                var add_data = this.add_data,
                    course = this.oneCourse();
                    // course = {
                    //     token: token,
                    //     time: this.date,
                    //     _ampm: '',
                    //     get ampm(){
                    //         switch(this._ampm){
                    //             case '上午':
                    //                 return 0;
                    //             case '下午':
                    //                 return 1;
                    //         }
                    //     },
                    //     startTime: '',
                    //     endTime: '',
                    //     classId: this.classId,
                    //     lessonName: '',
                    // }

                add_data.splice(add_data.length,0,course);
            },
            deleteCourse: function (index) {
                var add_data = this.add_data;
                add_data.splice(index,1);
            },
            resetData: function(){
                this.add_data = [

                ]
            },
            addData: function () {
                var self = this;
                if(!this.gradeName || this.gradeName === '年级'){
                    alert('请选择年级');
                    return;
                }else if (!this.className || this.className === '班级'){
                    alert('请选择班级');
                    return;
                }
                var add_data = this.add_data,
                    len = add_data.length,
                    result = {
                        len: len,
                        success_count: 0,
                        error_count: 0,
                        get complated_count(){
                            return this.success_count + this.error_count;
                        },
                        set hint(val){
                            if(this.complated_count < this.len) return;
                            if(val === this.success_count){
                                alert('添加成功');
                            }else if(!this.success_count){
                                alert('添加失败');
                            }else {
                                alert(this.success_count+'条课程添加成功,'+this.error_count+'条课程添加失败');
                            }
                            self.add_data = [self.oneCourse()];
                        }
                    };
                var reg_ampm = /^(上|下)午$/,
                    reg_time = /^((1|0)\d|2[0-4]):[0-5]\d$/;
                for(var i = 0; i < len; i++){
                    if(!reg_ampm.exec(add_data[i]._ampm)){
                        alert('上午/下午必须填写\"上午\"或\"下午\"');
                        return;
                    }
                    if(!(reg_time.exec(add_data[i].startTime) && reg_time.exec(add_data[i].endTime))){
                        alert('时间段正确格式: 08:30');
                        return;
                    }
                    if(!add_data[i].lessonName){
                        alert('课程未填写');
                        return;
                    }
                }
                for(var i = 0; i < len; i++){
                    $.ajax({
                        url: baseUrl + '/addlesson.do',
                        data: add_data[i],
                        type: 'post',
                        success: function (data) {
                            switch (data.state) {
                                case 0:
                                    result.error_count += 1;
                                    break;
                                case 1:
                                    result.success_count += 1;
                                    break;
                            }
                            result.hint = result.complated_count;
                            $.ajax(self.xhr);
                            self.show_current = '课程列表';
                        },
                        error: function () {
                            console.log(this.data);
                            result.error_count += 1;
                            result.hint = result.complated_count;
                        }
                    });
                }
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '删除':
                        confirm('是否确认删除')&&
                        $.ajax({
                            url: baseUrl + '/deletelesson.do',
                            data: {
                                token: token,
                                lessonId: self.detail_data.lessonId
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
            pushInfo: function () {
                if(!this.classId){
                    alert('未选择班级');
                    return;
                }
                $.ajax({
                    url: baseUrl + '/pushNotify.do',
                    data: {
                        token: token,
                        classId: this.classId,
                        type: 4
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            alert('推送通知成功');
                        }else {
                            alert('推送通知失败');
                        }
                    }
                });
            }
        }
    });
    // 食谱设置
    var cookbookSet = Vue.component('cookbook-set',{
        template:
        '<div class="cookbookSet clearfix">' +
            '<div class="filter">' +
                '<public-date @giveTimes="$getTimes($event)"></public-date>'+
            '</div>'+
            '<div :key="index" v-for="(cook,index) in cooks" class="food">' +
                    '<div>食谱名称: <input :key="index" v-model="cook.foodName"  name="foodName" type="text"></div>'+
                    '<div class="cookInfo">食谱图片: <label :for="index">选择图片</label><input :id="index" :key="index" v-show="false" @change="getBase64(index)" ref="file" name="file" type="file"><img class="pic" :src="cook.foodImg" alt=""></div>'+
                    '<div>食谱描述: <textarea :key="index" v-model="cook.foodContent" name="foodContent"></textarea></div>'+
                    '<div><input @click="deleteCook(cook)"  class="btn" type="button" value="删除食谱"></div>'+
            '</div>'+
            '<div class="operation"><input @click="addCook" class="save" type="button" value="继续添加"><input @click="postCook" class="save" value="全部提交" type="button"></div>'+
        '</div>',
        data:function () {
            return {
                baseUrl: baseUrl + "/addrecipe.do?",
                token: token,
                time: 0,
                cooks:[
                    {
                        foodName: '',
                        foodContent: '',
                        foodImg: '',
                    }
                ],
                reader: new FileReader()
            }
        },
        methods: {
            getTimes: function (timestamp) {
                this.time = timestamp;
            },
            addCook: function () {
                var len = this.cooks.length,
                    o = {
                        foodName: '',
                        foodContent: '',
                        foodImg: '',
                    }
                this.cooks.splice(len,'',o);
            },
            deleteCook: function (cook) {
                this.cooks.splice(this.cooks.indexOf(cook),1);
            },
            getBase64: function (index) {
                var self = this,
                    file =  this.$refs.file[index].files[0];
                if(!/image/g.test(file.type)){
                    alert('请选择图片上传');
                    return;
                }
                this.reader.readAsDataURL(file);
                this.reader.onload = function () {

                    self.cooks[index].foodImg = this.result;

                }
            },
            postCook: function () {
                var postCook = this.cooks.map(function (item,index) {
                    var base64Arr = item.foodImg.split(';base64,'),
                        base64Str = base64Arr[base64Arr.length-1];
                    return {
                        foodName: item.foodName,
                        foodContent: item.foodContent,
                        foodImg: base64Str,
                    }
                });
                $.ajax({
                    url: baseUrl + '/addrecipe.do',
                    data: {
                        token: token,
                        time: this.time,
                        str: JSON.stringify(postCook)
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            alert('提交成功');
                        }
                    }
                })
            }
        },
        mounted: function () {
            console.log(this.$refs.file);
        }
    });
    // 食谱列表
    var cookbookList = Vue.component('cookbook-list',{
       template:
       '<div class="cookbookList">' +
            '<div class="filter">' +
                '日期: <public-date v-on:giveTimes="getTimes"></public-date>'+
                '<div style="margin-left: 10px" @click="pushInfo" class="btn-skyblue">推送通知</div>'+
            '</div>'+
            '<div :key="index" v-for="(cook,index) in tableItem" class="food">' +
                '<div>食谱名称: <input :key="index" v-model="cook.name"  name="foodName" type="text"></div>'+
                '<div class="cookInfo">食谱图片:<img class="pic" :src="cook.img" alt=""></div>'+
                '<div>食谱描述: <textarea :key="index" v-model="cook.desc" name="foodContent"></textarea></div>'+
                '<div><input @click="deleteData(index)" class="save" type="button" value="删除食谱"></div>'+
            '</div>'+
       '</div>',
        data:function () {
            return {
                time: 0,
                responseData: [],
                tableTitle: ['日期','食谱名称','食谱介绍'],
                tableItem:[],
            }
        },
        computed: {
           xhr: function () {
               var self = this;
               return {
                   url: baseUrl + '/recipe.do',
                   data: {
                       token: token,
                       time: this.time
                   },
                   type: 'post',
                   success: function (data) {
                       if(data.state === 0) return;
                       var tableItem = [];
                       self.responseData = data.info;
                       self.responseData.forEach(function (item,index) {
                           var cook = {};
                           cook.name = item.foodName;
                           cook.desc = item.foodContent;
                           cook.img = item.foodImg;
                           tableItem[index] = cook;
                       });
                       self.tableItem = tableItem;
                   }
               };
           }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        },
        methods: {
            getTimes: function (timestamp) {
                this.time = timestamp;
            },
            deleteData: function (index) {
                var self = this;
                $.ajax({
                    url: baseUrl + '/deleteRecipe.do',
                    data: {
                        token: token,
                        recipeId: self.responseData[index].recipeId
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            $.ajax(self.xhr);
                            alert('删除成功');
                        }
                    }
                })
            },
            pushInfo: function () {
                $.ajax({
                    url: baseUrl + '/pushNotify.do',
                    data: {
                        token: token,
                        type: 5
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            alert('推送通知成功');
                        }else {
                            alert('推送通知失败');
                        }
                    }
                });
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 全园缴费
    var payFees = Vue.component('pay-fees',{
       template:
        '<div class="payFees">' +
            '<div class="look-Detaildata">' +
                '<div class="filter">' +
                    '选择类型: '+
                    '<select v-model="pay_data.type">' +
                        '<option :value="null">类型</option>'+
                        '<option :value="2">全园视频</option>'+
                        '<option :value="3">全园考勤</option>'+
                        '<option :value="6">全园视频+考勤</option>'+
                    '</select>'+
                    '选择时长: '+
                    '<select v-model="pay_data.monthCount">' +
                        '<option :value="n" v-for="n in 12">{{n+'+"'个月'"+'}}</option>'+
                    '</select>'+
                '</div>'+
                '<label for="ali_pay"><input v-model="type" :value="1" name="pay" id="ali_pay" type="radio"><img src="images/pay_ali.png" alt=""><span style="color:#01aaed">支付宝支付</span></label>' +
                '<label for="wechat_pay"><input v-model="type" :value="2" name="pay" id="wechat_pay" type="radio"><img src="images/pay_wechat.png" alt=""><span style="color:#3ab133">微信支付</span></label>' +
                '<button @click="buyCreditMoney">去支付</button>'+
                '<div class="look-Detaildata" v-if="show_qrcode">' +
                    '<h3>微信扫一扫付款</h3>'+
                    '<div id="qrcode"></div>'+
                    '<div class="postData"><input class="clear" @click="cancelPay" value="取消" type="button"></div>'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                pay_data: {
                    token: token,
                    type: null,
                    monthCount: 1,
                    price: 0,
                },
                type: 1,
                show_qrcode: false,
                timer: null,
                orderNumber: null, //当前的订单编号
            }
        },
        methods: {
            buyCreditMoney: function () {
                var self = this;
                if(!this.pay_data.type) {
                    alert('未选择购买类型');
                    return;
                }
                $.ajax({
                    url: baseUrl + '/getPayPrice.do',
                    data: this.pay_data,
                    type: 'post',
                    success: function (data) {
                        switch(data.state){
                            case 1:
                                self.pay_data.price = data.price;
                                switch(self.type){
                                    case 1:
                                        location.href = baseUrl + '/alipay.do?' + self.$objToSearch(self.pay_data);
                                        break;
                                    case 2:
                                        self.show_qrcode = true;
                                        $.ajax({
                                            url: baseUrl + '/wxpay.do',
                                            data: self.pay_data,
                                            type: 'post',
                                            success: function (data) {
                                                if(data.state){
                                                    self.orderNumber = data.info.orderNumber;
                                                    var qrcode = new QRCode('qrcode',{
                                                        text: data.info.url,
                                                        width: 208,
                                                        height: 208,
                                                        colorDark: '#000000',
                                                        colorLight: '#ffffff',
                                                        correctLevel: QRCode.CorrectLevel.H
                                                    });
                                                    self.timer = setInterval(function () {
                                                        if(location.hash !== '#/payFees'){
                                                            clearInterval(self.timer);
                                                            return;
                                                        }
                                                        $.ajax({
                                                            url: baseUrl + '/wxpayyzOrder.do',
                                                            data: {
                                                                orderNumber: self.orderNumber
                                                            },
                                                            type: 'post',
                                                            success: function (data) {
                                                                if(data.state){
                                                                    alert('支付成功');
                                                                    clearInterval(self.timer);
                                                                }
                                                            }
                                                        });
                                                    },3000);
                                                }else {
                                                    alert('生成二维码失败');
                                                }
                                            }
                                        });
                                        break;
                                }
                                break;
                            case 3:
                                alert('您的幼儿园未设置收费标准');
                                break;
                            case 4:
                                alert('该幼儿园还未添加家长');
                                break;
                        }
                    }
                })


                switch (this.type){
                    case 1:
                        var payUrl = baseUrl + '/alipay.do?' + this.$objToSearch(this.pay_data);
                        location.href = payUrl;
                        break;
                    case 2:


                        break;
                        // var qrcode =  new QRCode('qrcode',{
                        //     text: url,
                        //     width: 208,
                        //     height: 208,
                        //     colorDark: '#000000',
                        //     colorLight : '#ffffff',
                        //     correctLevel : QRCode.CorrectLevel.H
                        // });
                }
            },
            cancelPay: function () {
                
            },
            beforeCreate: function () {
                $.ajax({
                    url: baseUrl + '/getPayPrice.do',
                    data: {
                        token: token,

                    }
                });
            }
        }
    });
    // 付费查询
    var payQuery = Vue.component('pay-query',{
        template:
        '<div class="payQuery">' +
            '<div class="filter">' +
                '<div>' +
                    '开始日期: <public-date v-on:giveTimes="$getTimes($event,'+"'startTime'"+')"></public-date>'+
                    '结束日期: <public-date v-on:giveTimes="$getTimes($event,'+"'endTime'"+')"></public-date>'+
                    '付款人姓名: <input  v-model="name" type="text">'+
                    '手机号: <input v-model="phoneNumber" type="text">'+
                    '宝宝姓名: <input v-model="babyName" type="text">'+
                    '订单类型: <input v-model="orderDetail" type="text">'+
                '</div>'+
            '</div>'+
            '<public-table :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
            '<public-paging v-on:givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
        '</div>',
        data: function () {
            return {
                startTime:0,
                endTime:0,
                name:'',
                phoneNumber:'',
                pageNo:1,
                babyName: '',
                orderDetail: '',
                pageCount:1,
                tableTitle: ['付款人','手机号','宝宝姓名','订单状态','订单编号','订单内容','下单时间','支付方式','订单金额'],
                tableItem: []
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/order.do',
                    data: {
                        token: token,
                        startTime: this.startTime,
                        endTime: this.endTime,
                        name: this.name,
                        phoneNumber: this.phoneNumber,
                        babyName: '',
                        orderDetail: '',
                        pageNo: this.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.pageCount = data.pageCount;
                            self.tableItem = data.info.map(function (item,index) {
                                 return {
                                     name: item.name,
                                     phoneNumber: item.phoneNumber,
                                     babyName: item.babyName,
                                     state: item.state == 0 ? '未支付' : '已支付',
                                     orderNumber:item.orderNumber,
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
                                                 return '手动开通家长视频';
                                             case 9:
                                                 return '手动开通家长考勤';
                                             case 11:
                                                 return '手动开通家长视频+考勤';
                                             case 12:
                                                 return '手动开通全园视频';
                                             case 13:
                                                 return '手动开通全园考勤';
                                             case 16:
                                                 return '手动开通全园视频+考勤';
                                         }
                                     },
                                     orderTime: self.$formatDate(item.orderTime,true),
                                     payType: item.payType == 0 ? '支付宝' : '微信',
                                     orderMoney: item.orderMoney,
                                 }
                                 tableItem[index] = order;
                            });
                        }
                    }
                });
            }
        },
        watch: {
            xhr: function () {
                $.ajax(this.xhr);
            }
        }
    });
    // 校园简介
    var schoolIntroduction =  Vue.component('school-Introduction',{
        template:
            '<div class="schoolSet">' +
                '<div @click="showTab($event)" class="nav">' +
                    '<div :class="{current: this.show_current === '+"'校园简介展示'"+'}">校园简介展示</div>'+
                    '<div :class="{current: this.show_current === '+"'校园简介设置'"+'}">校园简介设置</div>'+
                '</div>'+
                '<div v-if="show_current === '+"'校园简介展示'"+'">' +
                    '<iframe :src="introUrl" frameborder="1" width="750" height="600"></iframe>'+
                '</div>'+
                '<div v-show="show_current === '+"'校园简介设置'"+'">' +
                    '<div class="introDetail">' +
                        '<div  class="board" v-for="(board,index) in school_info">' +
                            '<label v-for="(img,imgIndex) in board.img" :for="'+"'board_'+index+'img_'+imgIndex"+'">' +
                                '<img :src="school_info[index]['+"'img'"+'][imgIndex] || null">' +
                                '<input class="clear" @click="IntroControl('+"'deleteImg'"+',board,imgIndex)" type="button" value="删除图片">' +
                                '<input @change="bindImage($event,board,imgIndex)" :id="'+"'board_'+index+'img_'+imgIndex"+'" type="file">'+
                            '</label>'+
                            '<div class="content" v-for="(content,contentIndex) in board.content">' +
                                '<textarea @input="bindContent($event,board,contentIndex)"  :value="content"></textarea>'+
                                '<input class="clear" @click="IntroControl('+"'deleteContent'"+',board,contentIndex)" type="button" value="删除介绍">'+
                            '</div>' +
                            '<div>' +
                                '<input @click="IntroControl('+"'addImg'"+',board)" class="btn" type="button" value="添加图片">' +
                                '<input @click="IntroControl('+"'addContent'"+',board)" style="margin-left:30px" class="btn" type="button" value="添加介绍">' +
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="control-board">' +
                        '<input type="button" @click="IntroControl('+"'addBoard'"+')" class="add-intro btn" value="添加小版块">'+
                        '<input type="button" @click="IntroControl('+"'deleteBoard'"+')" class="delete-intro btn" value="删除小版块">'+
                        '<input type="button" @click="addData" class="save-intro btn" value="提交">'+
                    '</div>'+
                '</div>'+
            '</div>',
        data: function () {
            return {
                introUrl: '',
                show_current: '校园简介设置',
                school_info: [
                    {
                        img:[''],
                        content:['']
                    }
                ]
            }
        },
        methods: {
            showTab: function(e){
                var target = e.target.innerText;
                if(target !== '校园简介展示' && target !== '校园简介设置') return;
                this.show_current = target;
            },
            IntroControl: function (action,board,index) { //给版块新增、删除图片和内容
                var school_info = this.school_info;
                switch(action){
                    case 'addBoard':
                        var list = {
                            img:[''],
                            content:['']
                        };
                        school_info.splice(school_info.length,0,list);
                        break;
                    case 'deleteBoard':
                        school_info.splice(school_info.length-1,1);
                        break;
                    case 'addImg':
                        board.img.splice(board.img.length,0,'');
                        break;
                    case 'deleteImg':
                        board.img.splice(index,1);
                        break;
                    case 'addContent':
                        board.content.splice(board.content.length,0,'');
                        break;
                    case 'deleteContent':
                        board.content.splice(index,1);
                        break;
                }
            },
            bindImage: function (e,board,imgIndex) {
                var file = e.target,
                    reader = new FileReader();
                reader.readAsDataURL(file.files[0]);
                reader.onload = function () {
                    board.img.splice(imgIndex,1,this.result);
                    console.log(this.result);
                }
            },
            bindContent: function (e,board,contentIndex) {
                var text = e.target.value;
                board.content[contentIndex] = text;
            },
            addData: function () {
                var self = this;
                var webStr = JSON.parse(JSON.stringify(this.school_info));
                webStr.forEach(function (imgs,index) {
                    imgs.img = imgs.img.map(function (img) {
                        var img_split = img.split('base64,');
                        return img_split[img_split.length-1];
                    });
                });
                loader.show = true;
                $.ajax({
                    url: url + '/worker/htmlIntroduce.do',
                    data: {
                        token: token,
                        webStr: JSON.stringify(webStr)
                    },
                    type: 'post',
                    success: function (data) {
                        loader.show = false;
                        if(data){
                            self.requestHTML();
                            alert('添加成功');
                            self.show_current = '校园简介展示';
                        }
                    },
                    error: function () {
                        loader.show = false;
                    }
                });
            },
            requestHTML: function () {
                var self = this;
                $.ajax({
                    url: url + '/principal/introduceActivity.do',
                    data: {
                        token: token
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.introUrl = data.info;
                        }else {
                            alert('校园简介请求失败');
                        }
                    },error: function () {
                        alert('校园简介请求失败');
                    }
                });
            }
        },
        beforeMount: function () {
            this.requestHTML();
        }
    });
    // 校园活动
    var schoolActivity = Vue.component('school-activity',{
        template:
        '<div class="schoolSet">' +
            '<div @click="showTab($event)" class="nav">' +
                '<div :class="{current: this.show_current === '+"'校园活动列表'"+'}">校园活动列表</div>'+
                '<div :class="{current: this.show_current === '+"'校园活动设置'"+'}">校园活动设置</div>'+
                // '<div class="btn-skyblue>推送消息</div>'+
            '</div>'+
            '<div class="filter">' +
                '<div @click="pushInfo" class="btn-skyblue">推送消息</div>'+
            '</div>'+
            '<div v-if="show_current === '+"'校园活动列表'"+'">' +
                '<public-table v-on:giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>'+
                '<public-paging @givePageNo="$getPageNo($event,'+"'activity_list'"+')" :pageCount="activity_list.pageCount"></public-paging>'+
                '<div class="look-Detaildata " v-if="show_detail">' +
                    '<div class="activityIntro">' +
                        '<img :src="detail_data.img" alt="">'+
                        '<p>{{detail_data.content}}</p>'+
                        '<input @click="show_detail=false" class="btn" type="button" value="关闭">'+
                    '</div>'+
                    '<div class="postData"></div>'+
                '</div>'+
                '<div v-if="apply_list.show" class="look-Detaildata">' +
                    '<h3>报名详情</h3>'+
                    '<public-table :title="apply_list.tableTitle" :item="apply_list.tableItem" :itemCount="16-apply_list.tableItem.length"></public-table>'+
                    '<div><public-paging @givepageNo="$getPageNo($event,'+"'apply_list'"+')" :pageCount="apply_list.pageCount"></public-paging></div>'+
                    '<div class="postData"><input @click="apply_list.show=false" type="button" value="关闭" class="clear"> </div>'+
                '</div>'+
            '</div>'+
            '<div v-show="show_current === '+"'校园活动设置'"+'">' +
                '<div class="filter">' +
                    '活动开始日期: <public-date v-on:giveTimes="getTimeStart"></public-date>'+
                    '活动结束日期: <public-date v-on:giveTimes="getTimeEnd"></public-date>'+
                    '活动报名截止日期: <public-date v-on:giveTimes="getJoinTime"></public-date>'+
                '</div>'+
                '<div class="introDetail">' +
                    '<h3>活动名称:</h3> ' +
                    '<input v-model="title" class="activity_input" type="text">' +
                    '<h3>活动进行地址:</h3>'+
                    '<input v-model="activityAddress" class="activity_input" type="text">'+
                    '<h3>活动简介图片:</h3> ' +
                    '<label for="activity_file">' +
                        '<img :src="imgWaibu || null" alt="">'+
                        '<input @change="bindImage($event)" id="activity_file" type="file">'+
                    '</label>'+
                    '<h3>活动简介内容:</h3>' +
                    '<textarea @input="bindContent($event)" class="activity_content"></textarea>' +
                    '<h3>活动内容详情:</h3>'+
                    '<div class="board" v-for="(board,index) in school_info">' +
                        '<label v-for="(img,imgIndex) in board.img" :for="'+"'board_'+index+'img_'+imgIndex"+'">' +
                            '<img :src="school_info[index]['+"'img'"+'][imgIndex] || null">' +
                            '<input class="clear" @click="IntroControl('+"'deleteImg'"+',board,imgIndex)" type="button" value="删除图片">' +
                            '<input @change="bindImage($event,board,imgIndex)" :id="'+"'board_'+index+'img_'+imgIndex"+'" type="file">'+
                        '</label>'+
                        '<div class="content" v-for="(content,contentIndex) in board.content">' +
                            '<textarea @input="bindContent($event,board,contentIndex)"  :value="content"></textarea>'+
                            '<input class="clear" @click="IntroControl('+"'deleteContent'"+',board,contentIndex)" type="button" value="删除介绍">'+
                        '</div>' +
                        '<div>' +
                            '<input @click="IntroControl('+"'addImg'"+',board)" class="btn" type="button" value="添加图片">' +
                            '<input @click="IntroControl('+"'addContent'"+',board)" style="margin-left:30px" class="btn" type="button" value="添加介绍">' +
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="control-board control-board-active">' +
                    '<input type="button" @click="IntroControl('+"'addBoard'"+')" class="add-intro btn" value="添加小版块">'+
                    '<input type="button" @click="IntroControl('+"'deleteBoard'"+')" class="delete-intro btn" value="删除小版块">'+
                    '<input type="button" @click="addData" class="save-intro btn" value="提交">'+
                '</div>'+
            '</div>'+
        '</div>',
        data: function () {
            return {
                activityUrl: '',
                show_current: '校园活动列表',
                timeStart: 0,
                timeEnd: 0,
                joinTime: 0,
                title: '',
                imgWaibu: '',
                content: '',
                activityAddress: '',
                school_info: [
                    {
                        img: [''],
                        content: ['']
                    }
                ],
                responseData: [],
                detail_data: null,
                show_detail: false,
                tableTitle: ['活动名称', '活动开始日期', '活动结束日期', '报名截止日期', '报名人数', '隐藏', '操作'],
                tableItem: [],
                activity_list: {
                    token: token,
                    pageNo: 1,
                    pageCount: 1,
                },
                activityId: null,
                apply_list: {
                    show: false,
                    pageNo: 1,
                    pageCount: 1,
                    tableTitle: ['报名时间','家长姓名','宝宝姓名','联系方式'],
                    tableItem: []
                }
            };
        },
        computed: {
            xhr: function () {
                var self = this;
                return {
                    url: baseUrl + '/findActivity.do',
                    data: this.activity_list,
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.activity_list.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    title: item.title,
                                    timeStart: self.$formatDate(item.timeStart),
                                    timeEnd: self.$formatDate(item.timeEnd),
                                    joinTime: self.$formatDate(item.joinTime),
                                    count: item.count,
                                    operation: {
                                        action: ['查看活动简介','打开活动详情','查看报名','删除']
                                    }
                                }
                            });
                        }
                    }
                }
            },
            xhr_apply: function () {
                var self = this;
                return {
                    url: baseUrl + '/findActivityLogAll.do',
                    data: {
                        activityId: this.activityId,
                        pageNo: this.apply_list.pageNo
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            self.apply_list.pageCount = data.info.pageCount;
                            self.responseData = data.info.list;
                            self.apply_list.tableItem = self.responseData.map(function (item,index) {
                                return {
                                    registTime: item.registTime,
                                    parentName: item.parentName,
                                    babyName: item.babyName,
                                    phoneNumber: item.phoneNumber
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
            xhr_apply: function () {
                $.ajax(this.xhr_apply);
            }
        },
        methods: {
            showTab: function(e){
                var target = e.target.innerText;
                if(target !== '校园活动列表' && target !== '校园活动设置') return;
                this.show_current = target;
            },
            getOperation: function (index,value,type) {
                var self = this;
                this.detail_data = this.responseData[index];
                switch(value){
                    case '查看活动简介':
                        this.show_detail = true;
                        break;
                    case '打开活动详情':
                        // console.log(this.detail_data.contentHtml);
                        window.open(this.detail_data.contentHtml);
                        break;
                    case '查看报名':
                        this.apply_list.show = true;
                        this.activityId = this.detail_data.activityId;
                        break;
                    case '删除':
                        confirm('是否确认删除')&&
                            $.ajax({
                                url: url + '/worker/deleteActivity.do',
                                data: {
                                    activityId: self.detail_data.activityId
                                },
                                type: 'post',
                                success: function (data) {
                                    switch(data.state){
                                        case 0:
                                            alert('删除失败');
                                            break;
                                        case 1:
                                            $.ajax(self.xhr);
                                            alert('删除成功');
                                            break;
                                    }
                                }
                            });
                        break;
                }
            },
            getTimeStart: function (timestamp) {
                this.timeStart = timestamp;
            },
            getTimeEnd: function (timestamp) {
                this.timeEnd = timestamp;
            },
            getJoinTime: function (timestamp) {
                this.joinTime = timestamp;
            },
            IntroControl: function (action,board,index) { //给版块新增、删除图片和内容
                var school_info = this.school_info;
                switch(action){
                    case 'addBoard':
                        var list = {
                            img:[''],
                            content:['']
                        };
                        school_info.splice(school_info.length,0,list);
                        break;
                    case 'deleteBoard':
                        school_info.splice(school_info.length-1,1);
                        break;
                    case 'addImg':
                        board.img.splice(board.img.length,0,'');
                        break;
                    case 'deleteImg':
                        board.img.splice(index,1);
                        break;
                    case 'addContent':
                        board.content.splice(board.content.length,0,'');
                        break;
                    case 'deleteContent':
                        board.content.splice(index,1);
                        break;
                }
            },
            bindImage: function (e,board,imgIndex) {
                var self = this,
                    file = e.target,
                    reader = new FileReader();
                reader.readAsDataURL(file.files[0]);
                reader.onload = function () {
                    switch(file.id){
                        case 'activity_file':
                            self.imgWaibu = this.result;
                            break;
                        default:
                            board.img.splice(imgIndex,1,this.result);
                    }
                }
            },
            bindContent: function (e,board,contentIndex) {
                var target = e.target,
                    text = e.target.value;
                switch(target.className){
                    case 'activity_content':
                        this.content = text;
                        break;
                    default:
                    board.content[contentIndex] = text;
                }
            },
            addData: function () {
                var self = this;
                var webStr = JSON.parse(JSON.stringify(this.school_info));
                webStr.forEach(function (imgs,index) {
                    imgs.img = imgs.img.map(function (img) {
                        var img_split = img.split('base64,');
                        return img_split[img_split.length-1];
                    });
                });
                var imgWaibu = this.imgWaibu.split('base64,');
                loader.show = true;
                $.ajax({
                    url: url + '/worker/htmlActivity.do',
                    data: {
                        token: token,
                        webStr: JSON.stringify(webStr),
                        content: this.content,
                        timeStart: this.timeStart,
                        timeEnd: this.timeEnd,
                        imgWaibu: imgWaibu[imgWaibu.length-1],
                        activityAddress: this.activityAddress,
                        joinTime: this.joinTime,
                        title: this.title
                    },
                    type: 'post',
                    success: function (data) {
                        loader.show = false;
                        if(data){
                            $.ajax(self.xhr);
                            alert('添加成功');
                            self.show_current = '校园活动列表';
                        }
                    },
                    error: function () {
                        loader.show = false;
                    }
                });
            },
            pushInfo: function () {
                $.ajax({
                    url: baseUrl + '/pushNotify.do',
                    data: {
                        token: token,
                        type: 7
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            alert('推送通知成功');
                        }else {
                            alert('推送通知失败');
                        }
                    }
                });
            }
        },
        beforeMount: function () {
            $.ajax(this.xhr);
        }
    });
    // 意见反馈
    var ideaFeedback = Vue.component('idea-feedback',{
        template:
            '<div>' +
                '<div class="nav">' +
                    '<div class="current">意见反馈</div>'+
                '</div>'+
                // '<div>' +
                //     '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
                //     '<public-paging @givePageNo="getPageNo" :pageCount="pageCount"></public-paging>'+
                // '</div>'+
                '<div class="add-Newdata">' +
                    '<h3>意见反馈</h3>'+
                    '<div>反馈内容: <textarea v-model="content"></textarea></div>'+
                    '<div class="postData">' +
                        '<input @click="feedbackIdea" type="button" value="提交" class="save">'+
                    '</div>'+
                '</div>'+
            '</div>',
                data: function () {
            return {
                content: ''
            }
        },
        computed: {
            xhr: function () {
                var self = this;
                return {

                }
            }
        },
        methods: {
            // getPageNo: Vue.prototype.$getPageNo,
            // getOperation: function (index,value,type) {
            // },
            // getTimes: Vue.prototype.$getTimes,
            feedbackIdea: function () {
                $.ajax({
                    url: baseUrl + '/feedback.do',
                    data: {
                        token: token,
                        content: this.content,
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            alert('反馈成功');
                        }else {
                            alert('反馈失败');
                        }
                    },error: function () {
                        alert('反馈失败');
                    }
                });
            }
        }
    });

    // template:
    //     '<div>' +
    //         '<div @click="showTab($event)" class="nav">' +
    //             '<div :class="{current:}"></div>'+
    //             '<div :class="{current:}"></div>'+
    //         '</div>'+
    //         '<div>' +
    //             '<public-table @giveOperation="getOperation" :title="tableTitle" :item="tableItem" :itemCount="16-tableItem.length"></public-table>' +
    //             '<public-paging @givePageNo="$getPageNo($event)" :pageCount="pageCount"></public-paging>'+
    //         '</div>'+
    //     '</div>',
    // data: function () {
    //     return {
    //         show_current: '',
    //         startTime: 0,
    //         endTime: 0,
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
    //     getOperation: function (index,value,type) {
    //     },
    // }

    var routes = [
        //个人信息
        {path: '/personalInfo', component: personalInfo},
        //幼儿园信息
        {path: '/kindergartenManage', component: kindergartenManage},
        //教职工管理
        {path: '/teacherManage', component: teacherManage},
        //宝宝管理
        {path: '/babyManage', component: babyManage},
        //家长管理
        {path: '/patriarchManage', component: patriarchManage},
        //消息推送
        {path: '/pushInfo', component: pushInfo},
        //消息历史
        {path: '/infoHistory', component: infoHistory},
        //申请发送短信（老师专用）
        {path: '/applyPushInfo', component: applyPushInfo},
        //短信审核
        {path: '/infoCheck', component: infoCheck},
        //年级管理
        {path: '/gradeManage', component: gradeManage},
        //班级管理
        {path: '/classManage', component: classManage},
        //毕业管理
        {path: '/upGradeManage', component: upGradeManage},
        //考勤时间管理
        {path: '/attendanceTimeManage', component: attendanceTimeManage},
        //考勤卡管理
        {path: '/attendanceCardManage', component: attendanceCardManage},
        //打卡记录
        {path: '/attendanceHistory', component: attendanceHistory},
        //考勤异常管理
        {path: '/attendanceAnomalyManage', component: attendanceAnomalyManage},
        //请假管理
        {path: '/leaveManage', component: leaveManage},
        //晨检查看
        {path: '/morningCheckLook', component: morningCheckLook},
        //课程管理
        {path: '/curriculumManage', component: curriculumManage},
        //食谱设置
        {path: '/cookbookSet', component: cookbookSet},
        //食谱列表
        {path: '/cookbookList', component: cookbookList},
        //付费查询
        {path: '/payQuery', component: payQuery},
        //全园缴费
        {path: '/payFees',component: payFees},
        //校园简介
        {path: '/schoolIntroduction', component: schoolIntroduction},
        //校园活动
        {path: '/schoolActivity', component: schoolActivity},
        //意见反馈
        {path: '/ideaFeedback', component: ideaFeedback},

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
            gartenName: sessionStorage.gartenName + '管理后台',
            name: info.workerName,
            monitor_flow: 0,
            attendance_flow: 0,
            photo_flow: 0,
        },
        methods: {
            logout: function () {
                window.location.href = url + '/login.html';
            },
            getFlow: function () {
                var self = this;
                $.ajax({
                    url: baseUrl + '/VisitCount.do',
                    data: {
                        token: token
                    },
                    type: 'post',
                    success: function (data) {
                        if(data.state){
                            data.info.forEach(function (item,index) {
                                switch(item.type){
                                    case 1:
                                        self.attendance_flow = item.count;
                                        break;
                                    case 2:
                                        self.monitor_flow = item.count;
                                        break;
                                    case 3:
                                        self.photo_flow = item.count;
                                        break;
                                }
                            });
                        }
                    }
                })
            }
        },
        created: function () {
            this.getFlow();
        }
    });
    var main = new Vue({
        router: router,
        el: '#main',
        data: {
            permission: JSON.parse(info.permission) || {}
        },
        computed: {
            infoManage: function () {
                return this.permission.kindergartenManage ||
                this.permission.teacherManage ||
                this.permission.babyManage ||
                this.permission.patriarchManage
            },
            messageCenter: function () {
                return this.permission.pushInfo ||
                this.permission.infoHistory ||
                this.permission.applyPushInfo ||
                this.permission.infoCheck
            },
            classManage: function () {
                return  this.permission.gradeManage ||
                this.permission.classManage ||
                this.permission.upGradeManage
            },
            attendanceManage: function () {
                return this.permission.attendanceTimeManage ||
                this.permission.attendanceCardManage ||
                this.permission.attendanceHistory ||
                this.permission.attendanceAnomalyManage ||
                this.permission.leaveManage
            },
            morningCheck: function () {
                return this.permission.morningCheckLook
            },
            curriculumManage: function () {
                return  this.permission.curriculumManage
            },
            cookManage: function () {
                return  this.permission.cookbookSet ||
                this.permission.cookbookList
            },
            financeManage: function () {
                return this.permission.payQuery ||
                this.permission.payFees
            },
            schoolManage: function () {
                return    this.permission.schoolIntroduction ||
                this.permission.schoolActivity
            },
            other: function () {
                return  this.permission.ideaFeedback
            },
        }
    });


})(window, document);
