   // 时间表组件
    Vue.component('public-date', {
        props: ['date'],
        template:
        '<div class="timeTable">' +
            '<div class="timeTable-outer" @click="show_timeTable = !show_timeTable">{{timeTitle}}</div>'+
            '<div class="timeTable-main" v-if="show_timeTable">' +
                '<div class="timeTitle" @click="changeDate($event)">' +
                    '<i class="prevYear"></i>' +
                    '<i class="prevMonth"></i>' +
                    '<span class="timeTitle">{{timeTitle}}</span>' +
                    '<i class="nextYear"></i>' +
                    '<i class="nextMonth"></i>' +
                '</div>' +
                '<div class="timeContent">' +
                    '<div class="week">' +
                        '<span>周日</span>' +
                        '<span>周一</span>' +
                        '<span>周二</span>' +
                        '<span>周三</span>' +
                        '<span>周四</span>' +
                        '<span>周五</span>' +
                        '<span>周六</span>' +
                    '</div>' +
                    '<div class="day">' +
                        '<div v-for="day in render_before"><span class="otherMonth">{{day}}</span></div>'+
                        '<div class="render-main" @click="selectDate($event)" v-for="day in render_main"><span :class="{current_day: y == current_y && m == current_m && day == current_d, select_day: select_y == y && select_m == m && day == select_d}">{{day}}</span></div>'+
                        '<div v-for="day in render_after"><span class="otherMonth">{{day}}</span></div>'+
                    '</div>'+
                '</div>' +
            '</div>'+
        '</div>',
        data: function () {
            return {
                show_timeTable: false,
                y: 0,
                m: 0,
                d: 0,
                current_y:0,
                current_m:0,
                current_d:0,
                select_y:0,
                select_m:0,
                select_d:0,
                render_before: [],
                render_main: [],
                render_after: [],
            };
        },
        computed: {
            year: function () {
                return this.y;
            },
            month: function () {
                return (this.m+1).toString()[1]? (this.m + 1) : '0' + (this.m + 1);
            },
            day: function () {
                return this.d.toString()[1]? this.d : '0' + this.d;
            },
            timeTitle: function () {
                return this.year + '-' + this.month + '-' + this.day;
            }
        },
        watch: {
            timeTitle: function () {
                var startWeek = new Date(this.y,this.m,1).getDay(),//当月第一天是周几
                    fullDay = new Date(this.y,this.m+1,0).getDate(),//当月有多少天
                    lastDay = new Date(this.y,this.m,0).getDate(),//上月最后一天是几号
                    total = (fullDay + startWeek) % 7 == 0 ? 0 :  (7 - (fullDay + startWeek) % 7); //总共需要渲染的天数
                var render_before = [],
                    render_main = [],
                    render_after = [];
                for(var i = lastDay - startWeek + 1; i <= lastDay; i++ ){
                    render_before[render_before.length] = i;
                }
                this.render_before = render_before;
                for( var i = 1; i <= fullDay; i++){
                    render_main[render_main.length] = i;
                }
                this.render_main = render_main;
                for(var i = 1; i <= total; i++){
                    render_after[render_after.length] = i;
                }
                this.render_after = render_after;
                this.giveTimes();
            }
        },
        methods: {
            giveTimes: function () {
                var timestamp = new Date(this.y,this.m,this.d)/1000; //以秒为单位
                this.$emit('giveTimes',timestamp);
            },
            //时间表上方点击事件
            changeDate: function (e) {
                var className = e.target.className;
                switch(className){
                    case 'prevYear':
                        this.y -= 1;
                        break;
                    case 'prevMonth':
                        if(this.m - 1 < 0){
                            this.y -= 1;
                            this.m = 11;
                        }else {
                            this.m -= 1;
                        }
                        break;
                    case 'nextYear':
                        this.y += 1;
                        break;
                    case 'nextMonth':
                        if(this.m + 1 > 11){
                            this.y += 1;
                            this.m = 0;
                        }else {
                            this.m += 1;
                        }
                        break;
                    default:
                        break;
                }
                var fullDay = new Date(this.y,this.m+1,0).getDate();
                this.d = fullDay < this.d ? fullDay : this.d;
            },
            //点击日期返还当前选择的时间戳
            selectDate: function (e) {
                var select_date = e.target.innerText;
                this.d = select_date;
                this.select_y = this.y;
                this.select_m = this.m;
                this.select_d = this.d;
                this.show_timeTable = false;
            }
        },
        created: function () {
            var now = new Date();
            this.y = this.current_y = now.getFullYear();
            this.m = this.current_m = now.getMonth();
            this.d = this.current_d = now.getDate();
            if(this.date){
                var date = new Date(this.date * 1000);
                this.y = date.getFullYear();
                this.m = date.getMonth();
                this.d = date.getDate();
            }
            this.giveTimes();
        }
    });

    //表格组件
    Vue.component('public-table', {
        //title 和 item 表格的标题和内容 类型为[] itemCount 每页需要填充的数量 默认16-已显示条数 multiple 是否显示checkbox
        props: ['title', 'item', 'itemCount', 'multiple'],
        template:
        '<table>' +
            '<thead>' +
                '<tr>' +
                    '<th style="cursor: pointer;color: #40d0a7" @click="checkAll = !checkAll" v-if="multiple">全选/取消全选</th>'+
                    '<th v-for="th in title " v-if="th !== '+"'隐藏'"+'">{{th}}</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                '<tr v-for="(tr,index) in item">' +
                    '<td v-if="multiple"><input type="checkbox" v-model="checkedIndex" :value="index"></td>'+
                    '<td v-for="(value,key) in tr" v-if="key !== '+"'operation'"+'">{{value}}</td>' +
                    //表格后面的操作选项
                    //如果有operation 则需要去css里隐藏倒数第二个td 倒数第二个td如果存在operation属性 就显示下面这个td 如果点击了一个元素 则返回index和span中的值
                    '<td v-if="tr.operation"><span v-for="value in tr.operation.action" :data-text="value" @click="giveOperation(index,value,tr.operation.type)">{{value}}</span></td>'+
                '</tr>' +
                //不足16条填充
                '<tr v-for="n in itemCount">' +
                    '<td v-for="n in tdLength"></td>' +
                '</tr>' +
            '</tbody>' +
        '</table>',
        data: function () {
            return {
                checkedIndex: [],
                checkAll: false,
            }
        },
        computed: {
            tdLength: function () {
                var len = 0;
                if(this.title[this.title.length - 2] === '隐藏'){
                    len =  this.title.length - 1;
                }else {
                    len =  this.title.length;
                }
                if(!this.multiple){
                    return len;
                }else {
                    return len + 1;
                }
            },
            allIndex: function () {
                if(this.multiple){
                    var arr = [];
                    for(var i = 0, len = this.item.length; i < len; i++){
                        arr[i] = i;
                    }
                    return arr;
                }else {
                    return [];
                }
            }
        },
        watch: {
            pageCount: function () {
                if( this.pageNo > pageCount && this.pageNo != 1){
                        this.pageNo = 1;
                }
            },
            checkedIndex: function () {
                this.giveCheckedIndex();
            },
            checkAll: function () {
                if(this.checkAll){
                    this.checkedIndex = this.allIndex;
                }else {
                    this.checkedIndex = [];
                }
            }
        },
        methods:{
            giveOperation: function (index,value,type) {
                this.$emit('giveOperation',index,value,type);
            },
            giveCheckedIndex: function () {
                this.$emit('giveCheckedIndex',[this.checkedIndex]);
                console.log(this.checkedIndex);
            }
        }
    });

    // 分页组件
    Vue.component('public-paging', {
        props: ['pageCount'], //用来接收总共多少页
        template: 
        '<div @click="givePageNo($event)" class="paging">' +
            '<input  type="button" value="首页" class="first">' +
            '<input  type="button" value="上一页" class="prev">' +
            '<input  type="button" value="下一页" class="next">' +
            '<input  type="button" value="尾页" class="last">' +
            '当前第 <span>{{pageNo}}</span> / <span>{{pageCount}}</span>页' +
            '<input class="input-go" type="text" v-model="goNo">' +
            '<input  class="go" type="button" value="go">' +
        '</div>',
        data: function () {
            return {
                pageNo: 1, //记录当前页数
                goNo: '',   //直接前往第几页
            }
        },
        computed: {
            //接受传递过来的pageCount
            _pageCount: function () {

                return this.pageCount;
            }
        },
        watch: {
            _pageCount: function () {
                // 总页数发生变化 pageNo初始化
                this.pageNo = 1;
            },
            pageNo: function () {
                this.$emit('givePageNo', this.pageNo); //提交当前页数给父组件
            }
        },
        methods: {
            givePageNo: function (e) {
                switch (e.target.className) {
                    case 'first':
                        this.pageNo = 1;
                        break;
                    case 'prev' :
                        this.pageNo--;
                        break;
                    case 'next':
                        this.pageNo++;
                        break;
                    case 'last':
                        this.pageNo = this._pageCount;
                        break;
                    case 'go':
                        this.pageNo = parseInt(this.goNo);
                        if (this.pageNo !== this.pageNo) {
                            alert('请输入正确的数字');
                        }
                        break;
                }
                this.pageNo = this.pageNo < 1 ? 1 : this.pageNo;
                this.pageNo = this.pageNo > this._pageCount ? this._pageCount : this.pageNo;
            }
        }
    });
