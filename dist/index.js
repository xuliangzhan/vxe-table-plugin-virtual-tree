(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("vxe-table-plugin-virtual-tree", ["exports", "xe-utils"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("xe-utils"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.XEUtils);
    global.VXETablePluginVirtualTree = mod.exports.default;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _xeUtils) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = _exports.VXETablePluginVirtualTree = void 0;
  _xeUtils = _interopRequireDefault(_xeUtils);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  /* eslint-enable no-unused-vars */
  function countTreeExpand($xTree, prevRow) {
    var rowChildren = prevRow[$xTree.treeOpts.children];
    var count = 1;

    if ($xTree.isTreeExpandByRow(prevRow)) {
      for (var index = 0; index < rowChildren.length; index++) {
        count += countTreeExpand($xTree, rowChildren[index]);
      }
    }

    return count;
  }

  function getOffsetSize($xTree) {
    switch ($xTree.vSize) {
      case 'mini':
        return 3;

      case 'small':
        return 2;

      case 'medium':
        return 1;
    }

    return 0;
  }

  function calcTreeLine($table, $xTree, matchObj) {
    var index = matchObj.index,
        items = matchObj.items;
    var expandSize = 1;

    if (index) {
      expandSize = countTreeExpand($xTree, items[index - 1]);
    }

    return $table.rowHeight * expandSize - (index ? 1 : 12 - getOffsetSize($xTree));
  }

  function registerComponent(_ref) {
    var Vue = _ref.Vue,
        Table = _ref.Table,
        Grid = _ref.Grid,
        setup = _ref.setup,
        t = _ref.t;
    var GlobalConfig = setup();
    var propKeys = Object.keys(Table.props).filter(function (name) {
      return ['data', 'treeConfig'].indexOf(name) === -1;
    });
    var VirtualTree = {
      name: 'VxeVirtualTree',
      "extends": Grid,
      data: function data() {
        return {
          removeList: []
        };
      },
      computed: {
        vSize: function vSize() {
          return this.size || this.$parent.size || this.$parent.vSize;
        },
        treeOpts: function treeOpts() {
          return Object.assign({
            children: 'children',
            hasChild: 'hasChild',
            indent: 20
          }, GlobalConfig.treeConfig, this.treeConfig);
        },
        renderClass: function renderClass() {
          var _ref2;

          var vSize = this.vSize;
          return ['vxe-grid vxe-virtual-tree', (_ref2 = {}, _defineProperty(_ref2, "size--".concat(vSize), vSize), _defineProperty(_ref2, 't--animat', this.animat), _defineProperty(_ref2, 'has--tree-line', this.treeConfig && this.treeOpts.line), _defineProperty(_ref2, 'is--maximize', this.isMaximized()), _ref2)];
        },
        tableExtendProps: function tableExtendProps() {
          var _this = this;

          var rest = {};
          propKeys.forEach(function (key) {
            rest[key] = _this[key];
          });
          return rest;
        }
      },
      watch: {
        columns: function columns() {
          this.loadColumn(this.handleColumns());
        },
        data: function data(value) {
          this.loadData(value);
        }
      },
      created: function created() {
        var data = this.data;
        Object.assign(this, {
          fullTreeData: [],
          tableData: [],
          fullTreeRowMap: new Map()
        });
        this.handleColumns();

        if (data) {
          this.reloadData(data);
        }
      },
      methods: {
        getTableOns: function getTableOns() {
          var _this2 = this;

          var $listeners = this.$listeners,
              proxyConfig = this.proxyConfig,
              proxyOpts = this.proxyOpts;
          var ons = {};

          _xeUtils["default"].each($listeners, function (cb, type) {
            ons[type] = function () {
              for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
              }

              _this2.$emit.apply(_this2, [type].concat(args));
            };
          });

          ons['checkbox-all'] = this.checkboxAllEvent;
          ons['checkbox-change'] = this.checkboxChangeEvent;

          if (proxyConfig) {
            if (proxyOpts.sort) {
              ons['sort-change'] = this.sortChangeEvent;
            }

            if (proxyOpts.filter) {
              ons['filter-change'] = this.filterChangeEvent;
            }
          }

          return ons;
        },
        renderTreeLine: function renderTreeLine(params, h) {
          var treeConfig = this.treeConfig,
              treeOpts = this.treeOpts,
              fullTreeRowMap = this.fullTreeRowMap;
          var $table = params.$table,
              row = params.row,
              column = params.column;
          var treeNode = column.treeNode;

          if (treeNode && treeConfig && treeOpts.line) {
            var $xTree = this;
            var rowLevel = row._X_LEVEL;
            var matchObj = fullTreeRowMap.get(row);
            return [treeNode && treeOpts.line ? h('div', {
              "class": 'vxe-tree--line-wrapper'
            }, [h('div', {
              "class": 'vxe-tree--line',
              style: {
                height: "".concat(calcTreeLine($table, $xTree, matchObj), "px"),
                left: "".concat(rowLevel * (treeOpts.indent || 20) + (rowLevel ? 2 - getOffsetSize($xTree) : 0) + 16, "px")
              }
            })]) : null];
          }

          return [];
        },
        renderTreeIcon: function renderTreeIcon(params, h, cellVNodes) {
          var _this3 = this;

          var isHidden = params.isHidden;
          var row = params.row;
          var _this$treeOpts = this.treeOpts,
              children = _this$treeOpts.children,
              indent = _this$treeOpts.indent,
              trigger = _this$treeOpts.trigger,
              iconOpen = _this$treeOpts.iconOpen,
              iconClose = _this$treeOpts.iconClose;
          var rowChildren = row[children];
          var isAceived = false;
          var on = {};

          if (!isHidden) {
            isAceived = row._X_EXPAND;
          }

          if (!trigger || trigger === 'default') {
            on.click = function () {
              return _this3.toggleTreeExpand(row);
            };
          }

          return [h('div', {
            "class": ['vxe-cell--tree-node', {
              'is--active': isAceived
            }],
            style: {
              paddingLeft: "".concat(row._X_LEVEL * indent, "px")
            }
          }, [rowChildren && rowChildren.length ? [h('div', {
            "class": 'vxe-tree--btn-wrapper',
            on: on
          }, [h('i', {
            "class": ['vxe-tree--node-btn', isAceived ? iconOpen || GlobalConfig.icon.TABLE_TREE_OPEN : iconClose || GlobalConfig.icon.TABLE_TREE_CLOSE]
          })])] : null, h('div', {
            "class": 'vxe-tree-cell'
          }, cellVNodes)])];
        },
        _loadTreeData: function _loadTreeData(data) {
          var _this4 = this;

          var selectRow = this.getRadioRecord();
          return this.$nextTick().then(function () {
            return _this4.$refs.xTable.loadData(data);
          }).then(function () {
            if (selectRow) {
              _this4.setRadioRow(selectRow);
            }
          });
        },
        loadData: function loadData(data) {
          return this._loadTreeData(this.toVirtualTree(data));
        },
        reloadData: function reloadData(data) {
          var _this5 = this;

          return this.$nextTick().then(function () {
            return _this5.$refs.xTable.reloadData(_this5.toVirtualTree(data));
          }).then(function () {
            return _this5.handleDefaultTreeExpand();
          });
        },
        isTreeExpandByRow: function isTreeExpandByRow(row) {
          return !!row._X_EXPAND;
        },
        setTreeExpansion: function setTreeExpansion(rows, expanded) {
          return this.setTreeExpand(rows, expanded);
        },
        setTreeExpand: function setTreeExpand(rows, expanded) {
          var _this6 = this;

          if (rows) {
            if (!_xeUtils["default"].isArray(rows)) {
              rows = [rows];
            }

            rows.forEach(function (row) {
              return _this6.virtualExpand(row, !!expanded);
            });
          }

          return this._loadTreeData(this.tableData);
        },
        setAllTreeExpansion: function setAllTreeExpansion(expanded) {
          return this.setAllTreeExpand(expanded);
        },
        setAllTreeExpand: function setAllTreeExpand(expanded) {
          return this._loadTreeData(this.virtualAllExpand(expanded));
        },
        toggleTreeExpansion: function toggleTreeExpansion(row) {
          return this.toggleTreeExpand(row);
        },
        toggleTreeExpand: function toggleTreeExpand(row) {
          return this._loadTreeData(this.virtualExpand(row, !row._X_EXPAND));
        },
        getTreeExpandRecords: function getTreeExpandRecords() {
          var hasChilds = this.hasChilds;
          var treeExpandRecords = [];

          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            if (row._X_EXPAND && hasChilds(row)) {
              treeExpandRecords.push(row);
            }
          }, this.treeOpts);

          return treeExpandRecords;
        },
        clearTreeExpand: function clearTreeExpand() {
          return this.setAllTreeExpand(false);
        },
        handleColumns: function handleColumns() {
          var _this7 = this;

          return this.columns.map(function (conf) {
            if (conf.treeNode) {
              var slots = conf.slots || {};
              slots.icon = _this7.renderTreeIcon;
              slots.line = _this7.renderTreeLine;
              conf.slots = slots;
            }

            return conf;
          });
        },
        hasChilds: function hasChilds(row) {
          var childList = row[this.treeOpts.children];
          return childList && childList.length;
        },

        /**
         * 获取表格数据集，包含新增、删除、修改
         */
        getRecordset: function getRecordset() {
          return {
            insertRecords: this.getInsertRecords(),
            removeRecords: this.getRemoveRecords(),
            updateRecords: this.getUpdateRecords()
          };
        },
        isInsertByRow: function isInsertByRow(row) {
          return !!row._X_INSERT;
        },
        getInsertRecords: function getInsertRecords() {
          var insertRecords = [];

          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            if (row._X_INSERT) {
              insertRecords.push(row);
            }
          }, this.treeOpts);

          return insertRecords;
        },
        insert: function insert(records) {
          return this.insertAt(records);
        },
        insertAt: function insertAt(records, row) {
          var _this8 = this;

          var fullTreeData = this.fullTreeData,
              tableData = this.tableData,
              treeOpts = this.treeOpts;

          if (!_xeUtils["default"].isArray(records)) {
            records = [records];
          }

          var newRecords = records.map(function (record) {
            return _this8.defineField(Object.assign({
              _X_EXPAND: false,
              _X_INSERT: true,
              _X_LEVEL: 0
            }, record));
          });

          if (!row) {
            fullTreeData.unshift.apply(fullTreeData, newRecords);
            tableData.unshift.apply(tableData, newRecords);
          } else {
            if (row === -1) {
              fullTreeData.push.apply(fullTreeData, newRecords);
              tableData.push.apply(tableData, newRecords);
            } else {
              var matchObj = _xeUtils["default"].findTree(fullTreeData, function (item) {
                return item === row;
              }, treeOpts);

              if (!matchObj || matchObj.index === -1) {
                throw new Error(t('vxe.error.unableInsert'));
              }

              var items = matchObj.items,
                  index = matchObj.index,
                  nodes = matchObj.nodes;
              var rowIndex = tableData.indexOf(row);

              if (rowIndex > -1) {
                tableData.splice.apply(tableData, [rowIndex, 0].concat(newRecords));
              }

              items.splice.apply(items, [index, 0].concat(newRecords));
              newRecords.forEach(function (item) {
                item._X_LEVEL = nodes.length - 1;
              });
            }
          }

          return this._loadTreeData(tableData).then(function () {
            return {
              row: newRecords.length ? newRecords[newRecords.length - 1] : null,
              rows: newRecords
            };
          });
        },

        /**
         * 获取已删除的数据
         */
        getRemoveRecords: function getRemoveRecords() {
          return this.removeList;
        },
        removeSelecteds: function removeSelecteds() {
          return this.removeCheckboxRow();
        },

        /**
         * 删除选中数据
         */
        removeCheckboxRow: function removeCheckboxRow() {
          var _this9 = this;

          return this.remove(this.getSelectRecords()).then(function (params) {
            _this9.clearSelection();

            return params;
          });
        },
        remove: function remove(rows) {
          var _this10 = this;

          var removeList = this.removeList,
              fullTreeData = this.fullTreeData,
              treeOpts = this.treeOpts;
          var rest = [];

          if (!rows) {
            rows = fullTreeData;
          } else if (!_xeUtils["default"].isArray(rows)) {
            rows = [rows];
          }

          rows.forEach(function (row) {
            var matchObj = _xeUtils["default"].findTree(fullTreeData, function (item) {
              return item === row;
            }, treeOpts);

            if (matchObj) {
              var item = matchObj.item,
                  items = matchObj.items,
                  index = matchObj.index,
                  parent = matchObj.parent;

              if (!_this10.isInsertByRow(row)) {
                removeList.push(row);
              }

              if (parent) {
                var isExpand = _this10.isTreeExpandByRow(parent);

                if (isExpand) {
                  _this10.handleCollapsing(parent);
                }

                items.splice(index, 1);

                if (isExpand) {
                  _this10.handleExpanding(parent);
                }
              } else {
                _this10.handleCollapsing(item);

                items.splice(index, 1);

                _this10.tableData.splice(_this10.tableData.indexOf(item), 1);
              }

              rest.push(item);
            }
          });
          return this._loadTreeData(this.tableData).then(function () {
            return {
              row: rest.length ? rest[rest.length - 1] : null,
              rows: rest
            };
          });
        },

        /**
         * 处理默认展开树节点
         */
        handleDefaultTreeExpand: function handleDefaultTreeExpand() {
          var _this11 = this;

          var treeConfig = this.treeConfig,
              treeOpts = this.treeOpts,
              tableFullData = this.tableFullData;

          if (treeConfig) {
            var children = treeOpts.children,
                expandAll = treeOpts.expandAll,
                expandRowKeys = treeOpts.expandRowKeys;

            if (expandAll) {
              this.setAllTreeExpand(true);
            } else if (expandRowKeys) {
              var rowkey = this.rowId;
              expandRowKeys.forEach(function (rowid) {
                var matchObj = _xeUtils["default"].findTree(tableFullData, function (item) {
                  return rowid === _xeUtils["default"].get(item, rowkey);
                }, treeOpts);

                var rowChildren = matchObj ? matchObj.item[children] : 0;

                if (rowChildren && rowChildren.length) {
                  _this11.setTreeExpand(matchObj.item, true);
                }
              });
            }
          }
        },

        /**
         * 定义树属性
         */
        toVirtualTree: function toVirtualTree(treeData) {
          var fullTreeRowMap = this.fullTreeRowMap;
          fullTreeRowMap.clear();

          _xeUtils["default"].eachTree(treeData, function (item, index, items, paths, parent, nodes) {
            item._X_EXPAND = false;
            item._X_INSERT = false;
            item._X_LEVEL = nodes.length - 1;
            fullTreeRowMap.set(item, {
              item: item,
              index: index,
              items: items,
              paths: paths,
              parent: parent,
              nodes: nodes
            });
          });

          this.fullTreeData = treeData.slice(0);
          this.tableData = treeData.slice(0);
          return treeData;
        },

        /**
         * 展开/收起树节点
         */
        virtualExpand: function virtualExpand(row, expanded) {
          if (row._X_EXPAND !== expanded) {
            if (row._X_EXPAND) {
              this.handleCollapsing(row);
            } else {
              this.handleExpanding(row);
            }
          }

          return this.tableData;
        },
        // 展开节点
        handleExpanding: function handleExpanding(row) {
          if (this.hasChilds(row)) {
            var tableData = this.tableData,
                treeOpts = this.treeOpts;
            var childRows = row[treeOpts.children];
            var expandList = [];
            var rowIndex = tableData.indexOf(row);

            if (rowIndex === -1) {
              throw new Error('错误的操作！');
            }

            _xeUtils["default"].eachTree(childRows, function (item, index, obj, paths, parent, nodes) {
              if (!parent || parent._X_EXPAND) {
                expandList.push(item);
              }
            }, treeOpts);

            row._X_EXPAND = true;
            tableData.splice.apply(tableData, [rowIndex + 1, 0].concat(expandList));
          }

          return this.tableData;
        },
        // 收起节点
        handleCollapsing: function handleCollapsing(row) {
          if (this.hasChilds(row)) {
            var tableData = this.tableData,
                treeOpts = this.treeOpts;
            var childRows = row[treeOpts.children];
            var nodeChildList = [];

            _xeUtils["default"].eachTree(childRows, function (item) {
              nodeChildList.push(item);
            }, treeOpts);

            row._X_EXPAND = false;
            this.tableData = tableData.filter(function (item) {
              return nodeChildList.indexOf(item) === -1;
            });
          }

          return this.tableData;
        },

        /**
         * 展开/收起所有树节点
         */
        virtualAllExpand: function virtualAllExpand(expanded) {
          var treeOpts = this.treeOpts;

          if (expanded) {
            var tableList = [];

            _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
              row._X_EXPAND = expanded;
              tableList.push(row);
            }, treeOpts);

            this.tableData = tableList;
          } else {
            _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
              row._X_EXPAND = expanded;
            }, treeOpts);

            this.tableData = this.fullTreeData.slice(0);
          }

          return this.tableData;
        },
        checkboxAllEvent: function checkboxAllEvent(params) {
          var _this$checkboxConfig = this.checkboxConfig,
              checkboxConfig = _this$checkboxConfig === void 0 ? {} : _this$checkboxConfig,
              treeOpts = this.treeOpts;
          var checkField = checkboxConfig.checkField,
              halfField = checkboxConfig.halfField,
              checkStrictly = checkboxConfig.checkStrictly;
          var checked = params.checked;

          if (checkField && !checkStrictly) {
            _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
              row[checkField] = checked;

              if (halfField) {
                row[halfField] = false;
              }
            }, treeOpts);
          }

          this.$emit('checkbox-all', params);
        },
        checkboxChangeEvent: function checkboxChangeEvent(params) {
          var _this$checkboxConfig2 = this.checkboxConfig,
              checkboxConfig = _this$checkboxConfig2 === void 0 ? {} : _this$checkboxConfig2,
              treeOpts = this.treeOpts;
          var checkField = checkboxConfig.checkField,
              halfField = checkboxConfig.halfField,
              checkStrictly = checkboxConfig.checkStrictly;
          var row = params.row,
              checked = params.checked;

          if (checkField && !checkStrictly) {
            _xeUtils["default"].eachTree([row], function (row) {
              row[checkField] = checked;

              if (halfField) {
                row[halfField] = false;
              }
            }, treeOpts);

            this.checkParentNodeSelection(row);
          }

          this.$emit('checkbox-change', params);
        },
        checkParentNodeSelection: function checkParentNodeSelection(row) {
          var _this$checkboxConfig3 = this.checkboxConfig,
              checkboxConfig = _this$checkboxConfig3 === void 0 ? {} : _this$checkboxConfig3,
              treeOpts = this.treeOpts;
          var children = treeOpts.children;
          var checkField = checkboxConfig.checkField,
              halfField = checkboxConfig.halfField,
              checkStrictly = checkboxConfig.checkStrictly;

          var matchObj = _xeUtils["default"].findTree(this.fullTreeData, function (item) {
            return item === row;
          }, treeOpts);

          if (matchObj && checkField && !checkStrictly) {
            var parentRow = matchObj.parent;

            if (parentRow) {
              var isAll = parentRow[children].every(function (item) {
                return item[checkField];
              });

              if (halfField && !isAll) {
                parentRow[halfField] = parentRow[children].some(function (item) {
                  return item[checkField] || item[halfField];
                });
              }

              parentRow[checkField] = isAll;
              this.checkParentNodeSelection(parentRow);
            } else {
              this.$refs.xTable.checkSelectionStatus();
            }
          }
        },
        getCheckboxRecords: function getCheckboxRecords() {
          var _this$checkboxConfig4 = this.checkboxConfig,
              checkboxConfig = _this$checkboxConfig4 === void 0 ? {} : _this$checkboxConfig4,
              treeOpts = this.treeOpts;
          var checkField = checkboxConfig.checkField;

          if (checkField) {
            var records = [];

            _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
              if (row[checkField]) {
                records.push(row);
              }
            }, treeOpts);

            return records;
          }

          return this.$refs.xTable.getCheckboxRecords();
        },
        getCheckboxIndeterminateRecords: function getCheckboxIndeterminateRecords() {
          var _this$checkboxConfig5 = this.checkboxConfig,
              checkboxConfig = _this$checkboxConfig5 === void 0 ? {} : _this$checkboxConfig5,
              treeOpts = this.treeOpts;
          var halfField = checkboxConfig.halfField;

          if (halfField) {
            var records = [];

            _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
              if (row[halfField]) {
                records.push(row);
              }
            }, treeOpts);

            return records;
          }

          return this.$refs.xTable.getCheckboxIndeterminateRecords();
        }
      }
    };
    Vue.component(VirtualTree.name, VirtualTree);
  }
  /**
   * 基于 vxe-table 表格的增强插件，实现简单的虚拟树表格
   */


  var VXETablePluginVirtualTree = {
    install: function install(xtable) {
      // 注册组件
      registerComponent(xtable);
    }
  };
  _exports.VXETablePluginVirtualTree = VXETablePluginVirtualTree;

  if (typeof window !== 'undefined' && window.VXETable) {
    window.VXETable.use(VXETablePluginVirtualTree);
  }

  var _default = VXETablePluginVirtualTree;
  _exports["default"] = _default;
});