function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var reactDom = require('react-dom');
var core = require('@dnd-kit/core');
var sortable = require('@dnd-kit/sortable');
var utilities = require('@dnd-kit/utilities');

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _createForOfIteratorHelperLoose(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (t) return (t = t.call(r)).next.bind(t);
  if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
    t && (r = t);
    var o = 0;
    return function () {
      return o >= r.length ? {
        done: !0
      } : {
        done: !1,
        value: r[o++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

(function (ViewMode) {
  ViewMode["Hour"] = "Hour";
  ViewMode["QuarterDay"] = "Quarter Day";
  ViewMode["HalfDay"] = "Half Day";
  ViewMode["Day"] = "Day";
  ViewMode["Week"] = "Week";
  ViewMode["Month"] = "Month";
  ViewMode["QuarterYear"] = "QuarterYear";
  ViewMode["Year"] = "Year";
})(exports.ViewMode || (exports.ViewMode = {}));

var intlDTCache = {};
var getCachedDateTimeFormat = function getCachedDateTimeFormat(locString, opts) {
  if (opts === void 0) {
    opts = {};
  }
  var key = JSON.stringify([locString, opts]);
  var dtf = intlDTCache[key];
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(locString, opts);
    intlDTCache[key] = dtf;
  }
  return dtf;
};
var addToDate = function addToDate(date, quantity, scale) {
  var newDate = new Date(date.getFullYear() + (scale === "year" ? quantity : 0), date.getMonth() + (scale === "month" ? quantity : 0), date.getDate() + (scale === "day" ? quantity : 0), date.getHours() + (scale === "hour" ? quantity : 0), date.getMinutes() + (scale === "minute" ? quantity : 0), date.getSeconds() + (scale === "second" ? quantity : 0), date.getMilliseconds() + (scale === "millisecond" ? quantity : 0));
  return newDate;
};
var startOfDate = function startOfDate(date, scale) {
  var scores = ["millisecond", "second", "minute", "hour", "day", "month", "year"];
  var shouldReset = function shouldReset(_scale) {
    var maxScore = scores.indexOf(scale);
    return scores.indexOf(_scale) <= maxScore;
  };
  var newDate = new Date(date.getFullYear(), shouldReset("year") ? 0 : date.getMonth(), shouldReset("month") ? 1 : date.getDate(), shouldReset("day") ? 0 : date.getHours(), shouldReset("hour") ? 0 : date.getMinutes(), shouldReset("minute") ? 0 : date.getSeconds(), shouldReset("second") ? 0 : date.getMilliseconds());
  return newDate;
};
var ganttDateRange = function ganttDateRange(tasks, viewMode, preStepsCount) {
  var newStartDate = tasks[0].start;
  var newEndDate = tasks[0].start;
  for (var _iterator = _createForOfIteratorHelperLoose(tasks), _step; !(_step = _iterator()).done;) {
    var task = _step.value;
    if (task.start < newStartDate) {
      newStartDate = task.start;
    }
    if (task.end > newEndDate) {
      newEndDate = task.end;
    }
  }
  switch (viewMode) {
    case exports.ViewMode.Year:
      newStartDate = addToDate(newStartDate, -1, "year");
      newStartDate = startOfDate(newStartDate, "year");
      newEndDate = addToDate(newEndDate, 1, "year");
      newEndDate = startOfDate(newEndDate, "year");
      break;
    case exports.ViewMode.QuarterYear:
      newStartDate = addToDate(newStartDate, -3, "month");
      newStartDate = startOfDate(newStartDate, "month");
      newEndDate = addToDate(newEndDate, 3, "year");
      newEndDate = startOfDate(newEndDate, "year");
      break;
    case exports.ViewMode.Month:
      newStartDate = addToDate(newStartDate, -1 * preStepsCount, "month");
      newStartDate = startOfDate(newStartDate, "month");
      newEndDate = addToDate(newEndDate, 1, "year");
      newEndDate = startOfDate(newEndDate, "year");
      break;
    case exports.ViewMode.Week:
      newStartDate = startOfDate(newStartDate, "day");
      newStartDate = addToDate(getMonday(newStartDate), -7 * preStepsCount, "day");
      newEndDate = startOfDate(newEndDate, "day");
      newEndDate = addToDate(newEndDate, 1.5, "month");
      break;
    case exports.ViewMode.Day:
      newStartDate = startOfDate(newStartDate, "day");
      newStartDate = addToDate(newStartDate, -1 * preStepsCount, "day");
      newEndDate = startOfDate(newEndDate, "day");
      newEndDate = addToDate(newEndDate, 19, "day");
      break;
    case exports.ViewMode.QuarterDay:
      newStartDate = startOfDate(newStartDate, "day");
      newStartDate = addToDate(newStartDate, -1 * preStepsCount, "day");
      newEndDate = startOfDate(newEndDate, "day");
      newEndDate = addToDate(newEndDate, 66, "hour");
      break;
    case exports.ViewMode.HalfDay:
      newStartDate = startOfDate(newStartDate, "day");
      newStartDate = addToDate(newStartDate, -1 * preStepsCount, "day");
      newEndDate = startOfDate(newEndDate, "day");
      newEndDate = addToDate(newEndDate, 108, "hour");
      break;
    case exports.ViewMode.Hour:
      newStartDate = startOfDate(newStartDate, "hour");
      newStartDate = addToDate(newStartDate, -1 * preStepsCount, "hour");
      newEndDate = startOfDate(newEndDate, "day");
      newEndDate = addToDate(newEndDate, 1, "day");
      break;
  }
  return [newStartDate, newEndDate];
};
var seedDates = function seedDates(startDate, endDate, viewMode) {
  var currentDate = new Date(startDate);
  var dates = [currentDate];
  while (currentDate < endDate) {
    switch (viewMode) {
      case exports.ViewMode.Year:
        currentDate = addToDate(currentDate, 1, "year");
        break;
      case exports.ViewMode.QuarterYear:
        currentDate = addToDate(currentDate, 3, "month");
        break;
      case exports.ViewMode.Month:
        currentDate = addToDate(currentDate, 1, "month");
        break;
      case exports.ViewMode.Week:
        currentDate = addToDate(currentDate, 7, "day");
        break;
      case exports.ViewMode.Day:
        currentDate = addToDate(currentDate, 1, "day");
        break;
      case exports.ViewMode.HalfDay:
        currentDate = addToDate(currentDate, 12, "hour");
        break;
      case exports.ViewMode.QuarterDay:
        currentDate = addToDate(currentDate, 6, "hour");
        break;
      case exports.ViewMode.Hour:
        currentDate = addToDate(currentDate, 1, "hour");
        break;
    }
    dates.push(currentDate);
  }
  return dates;
};
var getLocaleMonth = function getLocaleMonth(date, locale) {
  var bottomValue = getCachedDateTimeFormat(locale, {
    month: "long"
  }).format(date);
  bottomValue = bottomValue.replace(bottomValue[0], bottomValue[0].toLocaleUpperCase());
  return bottomValue;
};
var getLocalDayOfWeek = function getLocalDayOfWeek(date, locale, format) {
  var bottomValue = getCachedDateTimeFormat(locale, {
    weekday: format
  }).format(date);
  bottomValue = bottomValue.replace(bottomValue[0], bottomValue[0].toLocaleUpperCase());
  return bottomValue;
};
var getMonday = function getMonday(date) {
  var day = date.getDay();
  var diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};
var getWeekNumberISO8601 = function getWeekNumberISO8601(date) {
  var tmpDate = new Date(date.valueOf());
  var dayNumber = (tmpDate.getDay() + 6) % 7;
  tmpDate.setDate(tmpDate.getDate() - dayNumber + 3);
  var firstThursday = tmpDate.valueOf();
  tmpDate.setMonth(0, 1);
  if (tmpDate.getDay() !== 4) {
    tmpDate.setMonth(0, 1 + (4 - tmpDate.getDay() + 7) % 7);
  }
  var weekNumber = (1 + Math.ceil((firstThursday - tmpDate.valueOf()) / 604800000)).toString();
  if (weekNumber.length === 1) {
    return "0" + weekNumber;
  } else {
    return weekNumber;
  }
};
var getDaysInMonth = function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
};

var TASK_PROCESS_OPTIONS = ["設計", "開発", "テスト", "レビュー", "リリース", "その他"];
var TASK_STATUS_OPTIONS = ["未着手", "進行中", "完了", "保留"];
var TASK_STATUS_COLORS = {
  未着手: "#9e9e9e",
  進行中: "#2196f3",
  完了: "#4caf50",
  保留: "#ff9800"
};
var TASK_STATUS_BADGE_TEXT = {
  未着手: "未",
  進行中: "進",
  完了: "完",
  保留: "保"
};

var DEFAULT_VISIBLE_FIELDS = ["name", "start", "end", "process", "assignee", "plannedStart", "plannedEnd", "plannedEffort", "actualEffort", "status"];
var padTwo = function padTwo(value) {
  return value.toString().padStart(2, "0");
};
var formatDate = function formatDate(date) {
  if (!date) return "";
  return date.getFullYear() + "-" + padTwo(date.getMonth() + 1) + "-" + padTwo(date.getDate());
};
var parseDateFromInput = function parseDateFromInput(value) {
  if (!value) return undefined;
  var _value$split$map = value.split("-").map(function (v) {
      return parseInt(v, 10);
    }),
    year = _value$split$map[0],
    month = _value$split$map[1],
    day = _value$split$map[2];
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  var date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
};
var formatEffort = function formatEffort(effort, unit) {
  if (unit === void 0) {
    unit = "MH";
  }
  if (effort === undefined || effort === null || !Number.isFinite(effort) || effort < 0) {
    return "";
  }
  var base = unit === "MD" ? 8 : unit === "MM" ? 160 : 1;
  var converted = effort / base;
  var rounded = unit === "MH" ? effort : Math.round(converted * 10) / 10;
  return "" + rounded + unit;
};
var sanitizeEffortInput = function sanitizeEffortInput(value) {
  if (value === "") return undefined;
  var parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
};
var DEFAULT_TASK_PROCESS = TASK_PROCESS_OPTIONS.includes("その他") ? "その他" : TASK_PROCESS_OPTIONS[0];
var normalizeProcess = function normalizeProcess(process) {
  return TASK_PROCESS_OPTIONS.includes(process) ? process : DEFAULT_TASK_PROCESS;
};
var normalizeStatus = function normalizeStatus(status) {
  return TASK_STATUS_OPTIONS.includes(status) ? status : TASK_STATUS_OPTIONS[0];
};
var getStatusColor = function getStatusColor(status) {
  return TASK_STATUS_COLORS[normalizeStatus(status)];
};
var getStatusBadgeText = function getStatusBadgeText(status) {
  return TASK_STATUS_BADGE_TEXT[normalizeStatus(status)];
};
var resolveVisibleFields = function resolveVisibleFields(visibleFields) {
  return visibleFields && visibleFields.length > 0 ? visibleFields : DEFAULT_VISIBLE_FIELDS;
};

var styles = {"ganttTable":"_3_ygE","ganttTable_Header":"_1nBOt","ganttTable_HeaderSeparator":"_2eZzQ","ganttTable_HeaderItem":"_WuQ0f","ganttTable_HeaderItemDragging":"_Fc5Tl","ganttTable_DragHandle":"_b6dPy","ganttTable_DragHandleDisabled":"_3ZMNU","ganttTable_DragIcon":"_QZHO8","ganttTable_HeaderLabel":"_2ANS-","ganttTable_ResizeHandle":"_OJ-Vg","ganttTable_ResizeHandleActive":"_21P28"};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var classnames = createCommonjsModule(function (module) {
/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/
/* global define */

(function () {

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = '';

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (arg) {
				classes = appendClass(classes, parseValue(arg));
			}
		}

		return classes;
	}

	function parseValue (arg) {
		if (typeof arg === 'string' || typeof arg === 'number') {
			return arg;
		}

		if (typeof arg !== 'object') {
			return '';
		}

		if (Array.isArray(arg)) {
			return classNames.apply(null, arg);
		}

		if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
			return arg.toString();
		}

		var classes = '';

		for (var key in arg) {
			if (hasOwn.call(arg, key) && arg[key]) {
				classes = appendClass(classes, key);
			}
		}

		return classes;
	}

	function appendClass (value, newClass) {
		if (!newClass) {
			return value;
		}
	
		if (value) {
			return value + ' ' + newClass;
		}
	
		return value + newClass;
	}

	if ( module.exports) {
		classNames.default = classNames;
		module.exports = classNames;
	} else {
		window.classNames = classNames;
	}
}());
});

// A type of promise-like that resolves synchronously and supports only one observer

const _iteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator"))) : "@@iterator";

const _asyncIteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.asyncIterator || (Symbol.asyncIterator = Symbol("Symbol.asyncIterator"))) : "@@asyncIterator";

// Asynchronously call a function and send errors to recovery continuation
function _catch(body, recover) {
	try {
		var result = body();
	} catch(e) {
		return recover(e);
	}
	if (result && result.then) {
		return result.then(void 0, recover);
	}
	return result;
}

var styles$1 = {"taskListWrapper":"_3ZbQT","taskListTableRow":"_34SS0","taskListCell":"_3lLk3","overlayEditor":"_3Nu1y","overlayEditorPending":"_2jEdG","overlayEditorError":"_2TWaP","taskListNameWrapper":"_nI1Xw","taskListExpander":"_2QjE6","taskListEmptyExpander":"_2TfEi","taskListInput":"_1bdaa","taskListSelect":"_1u3fW","statusWrapper":"_dRJfs","statusBadge":"_33mea","statusText":"_vpQEz"};

var NULL_CHAR_REGEX = new RegExp(String.fromCharCode(0), "g");
var ALPHANUMERIC_REGEX = /[a-zA-Z0-9]/;
var resolveOverlayInputType = function resolveOverlayInputType(columnId) {
  switch (columnId) {
    case "start":
    case "end":
    case "plannedStart":
    case "plannedEnd":
      return "date";
    case "plannedEffort":
    case "actualEffort":
      return "number";
    case "process":
    case "status":
      return "select";
    case "name":
    case "assignee":
    default:
      return "text";
  }
};
var escapeSelectorValue = function escapeSelectorValue(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  var sanitized = value.replace(NULL_CHAR_REGEX, "\uFFFD");
  return Array.from(sanitized).map(function (_char, index) {
    var codePoint = _char.codePointAt(0);
    if (codePoint === undefined) {
      return "";
    }
    if (codePoint >= 0x1 && codePoint <= 0x1f || codePoint === 0x7f || index === 0 && codePoint >= 0x30 && codePoint <= 0x39 || index === 1 && codePoint >= 0x30 && codePoint <= 0x39 && sanitized.charCodeAt(0) === 0x2d) {
      return "\\" + codePoint.toString(16) + " ";
    }
    if (_char === "-" || _char === "_" || ALPHANUMERIC_REGEX.test(_char)) {
      return _char;
    }
    return "\\" + _char;
  }).join("");
};
var OverlayEditor = function OverlayEditor(_ref) {
  var editingState = _ref.editingState,
    taskListRef = _ref.taskListRef,
    headerContainerRef = _ref.headerContainerRef,
    bodyContainerRef = _ref.bodyContainerRef,
    onCommit = _ref.onCommit,
    onCancel = _ref.onCancel;
  var _useState = React.useState(null),
    rect = _useState[0],
    setRect = _useState[1];
  var _useState2 = React.useState(null),
    targetElement = _useState2[0],
    setTargetElement = _useState2[1];
  var inputRef = React.useRef(null);
  var defaultValueRef = React.useRef("");
  var compositionRef = React.useRef(false);
  var rafIdRef = React.useRef(null);
  var inputType = React.useMemo(function () {
    return resolveOverlayInputType(editingState.columnId);
  }, [editingState.columnId]);
  var selectOptions = React.useMemo(function () {
    if (editingState.columnId === "process") {
      return TASK_PROCESS_OPTIONS;
    }
    if (editingState.columnId === "status") {
      return TASK_STATUS_OPTIONS;
    }
    return [];
  }, [editingState.columnId]);
  var portalRoot = React.useMemo(function () {
    if (typeof document === "undefined") {
      return null;
    }
    return document.body;
  }, []);
  var resolveDefaultValue = React.useCallback(function (target) {
    var _target$textContent;
    var input = target.querySelector("input, textarea, select");
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      return input.value;
    }
    if (input instanceof HTMLSelectElement) {
      return input.value;
    }
    return ((_target$textContent = target.textContent) != null ? _target$textContent : "").trim();
  }, []);
  var findTargetElement = React.useCallback(function () {
    if (!taskListRef.current || !editingState.rowId || !editingState.columnId) {
      return null;
    }
    var rowId = escapeSelectorValue(editingState.rowId);
    var columnId = escapeSelectorValue(editingState.columnId);
    return taskListRef.current.querySelector("[data-row-id=\"" + rowId + "\"][data-column-id=\"" + columnId + "\"]");
  }, [editingState.columnId, editingState.rowId, taskListRef]);
  var updateRect = React.useCallback(function () {
    if (editingState.mode !== "editing") {
      setRect(null);
      setTargetElement(null);
      return;
    }
    var target = findTargetElement();
    if (!target) {
      setRect(null);
      setTargetElement(null);
      onCancel("unmounted");
      return;
    }
    if (targetElement !== target) {
      var nextDefaultValue = resolveDefaultValue(target);
      defaultValueRef.current = nextDefaultValue;
      if (inputRef.current) {
        inputRef.current.value = nextDefaultValue;
      }
      setTargetElement(target);
    }
    var nextRect = target.getBoundingClientRect();
    setRect({
      top: Math.round(nextRect.top),
      left: Math.round(nextRect.left),
      width: Math.round(nextRect.width),
      height: Math.round(nextRect.height)
    });
  }, [editingState.mode, findTargetElement, onCancel, resolveDefaultValue, targetElement]);
  var scheduleRectUpdate = React.useCallback(function () {
    if (rafIdRef.current !== null) {
      return;
    }
    rafIdRef.current = window.requestAnimationFrame(function () {
      rafIdRef.current = null;
      updateRect();
    });
  }, [updateRect]);
  React.useEffect(function () {
    if (editingState.mode !== "editing") {
      defaultValueRef.current = "";
      compositionRef.current = false;
      setRect(null);
      setTargetElement(null);
      return;
    }
    scheduleRectUpdate();
  }, [editingState.mode, scheduleRectUpdate]);
  React.useEffect(function () {
    if (editingState.mode !== "editing") {
      return undefined;
    }
    var handleScroll = function handleScroll() {
      return scheduleRectUpdate();
    };
    var handleResize = function handleResize() {
      return scheduleRectUpdate();
    };
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true
    });
    window.addEventListener("resize", handleResize, {
      capture: true
    });
    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true
    });
    var scrollTargets = [taskListRef.current, bodyContainerRef === null || bodyContainerRef === void 0 ? void 0 : bodyContainerRef.current, headerContainerRef === null || headerContainerRef === void 0 ? void 0 : headerContainerRef.current].filter(Boolean);
    scrollTargets.forEach(function (element) {
      return element.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true
      });
    });
    var ResizeObserverConstructor = typeof window !== "undefined" ? window.ResizeObserver : undefined;
    var resizeObserver = ResizeObserverConstructor ? new ResizeObserverConstructor(function () {
      return scheduleRectUpdate();
    }) : null;
    var observedElements = [targetElement, taskListRef.current, bodyContainerRef === null || bodyContainerRef === void 0 ? void 0 : bodyContainerRef.current, headerContainerRef === null || headerContainerRef === void 0 ? void 0 : headerContainerRef.current].filter(Boolean);
    observedElements.forEach(function (element) {
      return resizeObserver === null || resizeObserver === void 0 ? void 0 : resizeObserver.observe(element);
    });
    return function () {
      window.removeEventListener("scroll", handleScroll, {
        capture: true
      });
      window.removeEventListener("resize", handleResize, {
        capture: true
      });
      document.removeEventListener("scroll", handleScroll, {
        capture: true
      });
      scrollTargets.forEach(function (element) {
        return element.removeEventListener("scroll", handleScroll, {
          capture: true
        });
      });
      resizeObserver === null || resizeObserver === void 0 ? void 0 : resizeObserver.disconnect();
    };
  }, [bodyContainerRef, editingState.mode, headerContainerRef, scheduleRectUpdate, targetElement, taskListRef]);
  React.useEffect(function () {
    return function () {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);
  React.useEffect(function () {
    if (editingState.mode !== "editing") {
      return;
    }
    var input = inputRef.current;
    if (!input) {
      return;
    }
    if (editingState.pending) {
      input.focus();
      return;
    }
    input.focus();
    if (input instanceof HTMLInputElement) {
      input.select();
    }
  }, [editingState.mode, editingState.pending, targetElement]);
  var handleCommit = React.useCallback(function () {
    try {
      if (editingState.pending) {
        return Promise.resolve();
      }
      var input = inputRef.current;
      if (!input) {
        return Promise.resolve();
      }
      return Promise.resolve(onCommit(input.value, "enter")).then(function () {});
    } catch (e) {
      return Promise.reject(e);
    }
  }, [editingState.pending, onCommit]);
  var handleKeyDown = React.useCallback(function (event) {
    if (editingState.pending) {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      void handleCommit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel("escape");
    }
  }, [editingState.pending, handleCommit, onCancel]);
  var handleBlur = React.useCallback(function () {
    if (editingState.pending || compositionRef.current) {
      return;
    }
    var input = inputRef.current;
    if (!input) {
      return;
    }
    if (input.value === defaultValueRef.current) {
      onCancel("nochange-blur");
    }
  }, [editingState.pending, onCancel]);
  var handleInput = React.useCallback(function (event) {
    if (!editingState.pending) {
      return;
    }
    var input = event.currentTarget;
    input.value = defaultValueRef.current;
  }, [editingState.pending]);
  var handleCompositionStart = function handleCompositionStart() {
    compositionRef.current = true;
  };
  var handleCompositionEnd = function handleCompositionEnd() {
    compositionRef.current = false;
  };
  var handleInputElementRef = React.useCallback(function (element) {
    inputRef.current = element;
  }, []);
  if (editingState.mode !== "editing" || !rect || !portalRoot) {
    return null;
  }
  return reactDom.createPortal(React__default.createElement("div", {
    className: styles$1.overlayEditor + " " + (editingState.pending ? styles$1.overlayEditorPending : ""),
    "data-testid": "overlay-editor",
    style: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    }
  }, inputType === "select" ? React__default.createElement("select", {
    className: styles$1.taskListSelect,
    "data-testid": "overlay-editor-input",
    "aria-label": "\u30BB\u30EB\u7DE8\u96C6",
    defaultValue: defaultValueRef.current,
    style: {
      height: "100%"
    },
    ref: handleInputElementRef,
    disabled: editingState.pending,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    onInput: handleInput,
    onChange: handleInput
  }, selectOptions.map(function (option) {
    return React__default.createElement("option", {
      key: option,
      value: option
    }, option);
  })) : React__default.createElement("input", {
    className: styles$1.taskListInput,
    "data-testid": "overlay-editor-input",
    type: inputType,
    "aria-label": "\u30BB\u30EB\u7DE8\u96C6",
    defaultValue: defaultValueRef.current,
    style: {
      height: "100%"
    },
    ref: handleInputElementRef,
    readOnly: editingState.pending,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    onInput: handleInput,
    onChange: handleInput,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd
  }), editingState.errorMessage && React__default.createElement("div", {
    className: styles$1.overlayEditorError,
    role: "alert"
  }, editingState.errorMessage)), portalRoot);
};

var TaskListEditingStateContext = React__default.createContext(null);
var DEFAULT_MIN_WIDTH = 32;
var getDefaultWidth = function getDefaultWidth(field, rowWidth) {
  return field === "name" ? 140 : Number.parseInt(rowWidth, 10) || 155;
};
var TaskList = function TaskList(_ref) {
  var headerHeight = _ref.headerHeight,
    fontFamily = _ref.fontFamily,
    fontSize = _ref.fontSize,
    rowWidth = _ref.rowWidth,
    rowHeight = _ref.rowHeight,
    scrollY = _ref.scrollY,
    _ref$horizontalScroll = _ref.horizontalScroll,
    horizontalScroll = _ref$horizontalScroll === void 0 ? 0 : _ref$horizontalScroll,
    tasks = _ref.tasks,
    selectedTask = _ref.selectedTask,
    setSelectedTask = _ref.setSelectedTask,
    onExpanderClick = _ref.onExpanderClick,
    ganttHeight = _ref.ganttHeight,
    taskListRef = _ref.taskListRef,
    headerContainerRef = _ref.headerContainerRef,
    bodyContainerRef = _ref.bodyContainerRef,
    horizontalContainerClass = _ref.horizontalContainerClass,
    TaskListHeader = _ref.TaskListHeader,
    TaskListTable = _ref.TaskListTable,
    visibleFields = _ref.visibleFields,
    onUpdateTask = _ref.onUpdateTask,
    onCellCommit = _ref.onCellCommit,
    effortDisplayUnit = _ref.effortDisplayUnit,
    _ref$enableColumnDrag = _ref.enableColumnDrag,
    enableColumnDrag = _ref$enableColumnDrag === void 0 ? true : _ref$enableColumnDrag,
    onHorizontalScroll = _ref.onHorizontalScroll;
  var internalHorizontalRef = React.useRef(null);
  var internalHeaderRef = React.useRef(null);
  var horizontalContainerRef = bodyContainerRef != null ? bodyContainerRef : internalHorizontalRef;
  var headerRef = headerContainerRef != null ? headerContainerRef : internalHeaderRef;
  React.useEffect(function () {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollTop = scrollY;
    }
  }, [scrollY, horizontalContainerRef]);
  React.useEffect(function () {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollLeft = horizontalScroll;
    }
    if (headerRef.current) {
      headerRef.current.scrollLeft = horizontalScroll;
    }
  }, [horizontalScroll, horizontalContainerRef, headerRef]);
  var initialColumns = React.useMemo(function () {
    return visibleFields.map(function (field) {
      return {
        id: field,
        label: field,
        width: getDefaultWidth(field, rowWidth),
        minWidth: DEFAULT_MIN_WIDTH,
        visible: true
      };
    });
  }, [visibleFields, rowWidth]);
  var _useState = React.useState(initialColumns),
    columnsState = _useState[0],
    setColumnsState = _useState[1];
  React.useEffect(function () {
    setColumnsState(function (prev) {
      var existingMap = new Map(prev.map(function (column) {
        return [column.id, column];
      }));
      var nextColumns = visibleFields.map(function (field) {
        var existing = existingMap.get(field);
        if (existing) {
          return existing;
        }
        return {
          id: field,
          label: field,
          width: getDefaultWidth(field, rowWidth),
          minWidth: DEFAULT_MIN_WIDTH,
          visible: true
        };
      });
      return nextColumns;
    });
  }, [visibleFields, rowWidth]);
  var visibleColumns = React.useMemo(function () {
    return columnsState.filter(function (column) {
      return column.visible;
    });
  }, [columnsState]);
  var headerProps = {
    headerHeight: headerHeight,
    fontFamily: fontFamily,
    fontSize: fontSize,
    rowWidth: rowWidth,
    visibleFields: visibleFields,
    columnsState: columnsState,
    setColumnsState: setColumnsState,
    enableColumnDrag: enableColumnDrag
  };
  var selectedTaskId = selectedTask ? selectedTask.id : "";
  var tableProps = {
    rowHeight: rowHeight,
    rowWidth: rowWidth,
    fontFamily: fontFamily,
    fontSize: fontSize,
    tasks: tasks,
    selectedTaskId: selectedTaskId,
    setSelectedTask: setSelectedTask,
    onExpanderClick: onExpanderClick,
    visibleFields: visibleFields,
    onUpdateTask: onUpdateTask,
    onCellCommit: onCellCommit,
    effortDisplayUnit: effortDisplayUnit,
    columnsState: visibleColumns
  };
  var _useState2 = React.useState({
      mode: "viewing",
      rowId: null,
      columnId: null,
      trigger: null,
      pending: false,
      errorMessage: null
    }),
    editingState = _useState2[0],
    setEditingState = _useState2[1];
  var previousEditingStateRef = React.useRef(null);
  var closeEditing = React.useCallback(function () {
    setEditingState(function (prev) {
      if (prev.mode === "viewing") {
        return prev;
      }
      return {
        mode: "viewing",
        rowId: null,
        columnId: null,
        trigger: null,
        pending: false,
        errorMessage: null
      };
    });
  }, []);
  var mountedRef = React.useRef(true);
  React.useEffect(function () {
    return function () {
      mountedRef.current = false;
    };
  }, []);
  var cancelEditing = React.useCallback(function (reason) {
    if (editingState.mode !== "editing") {
      return;
    }
    console.debug("[edit:cancel]", {
      rowId: editingState.rowId,
      columnId: editingState.columnId,
      reason: reason
    });
    closeEditing();
  }, [closeEditing, editingState.columnId, editingState.mode, editingState.rowId]);
  var commitEditing = React.useCallback(function (value, trigger) {
    try {
      if (!onCellCommit) {
        return Promise.resolve();
      }
      if (editingState.mode !== "editing" || editingState.pending) {
        return Promise.resolve();
      }
      if (!editingState.rowId || !editingState.columnId) {
        return Promise.resolve();
      }
      var rowId = editingState.rowId;
      var columnId = editingState.columnId;
      setEditingState(function (prev) {
        if (prev.mode !== "editing" || prev.pending || prev.rowId !== rowId || prev.columnId !== columnId) {
          return prev;
        }
        return _extends({}, prev, {
          pending: true,
          errorMessage: null
        });
      });
      return Promise.resolve(_catch(function () {
        return Promise.resolve(onCellCommit({
          rowId: rowId,
          columnId: columnId,
          value: value,
          trigger: trigger
        })).then(function () {
          if (!mountedRef.current) {
            return;
          }
          setEditingState(function (prev) {
            if (prev.mode !== "editing" || prev.rowId !== rowId || prev.columnId !== columnId) {
              return prev;
            }
            return {
              mode: "viewing",
              rowId: null,
              columnId: null,
              trigger: null,
              pending: false,
              errorMessage: null
            };
          });
        });
      }, function (error) {
        console.error("[commit:error]", {
          rowId: rowId,
          columnId: columnId,
          trigger: trigger,
          message: error instanceof Error ? error.message : "unknown"
        });
        if (!mountedRef.current) {
          return;
        }
        setEditingState(function (prev) {
          if (prev.mode !== "editing" || prev.rowId !== rowId || prev.columnId !== columnId) {
            return prev;
          }
          return _extends({}, prev, {
            pending: false,
            errorMessage: "Commit failed. Please retry."
          });
        });
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }, [editingState, onCellCommit]);
  var selectCell = React.useCallback(function (rowId, columnId) {
    console.debug("[TaskList] select cell", {
      rowId: rowId,
      columnId: columnId
    });
    setEditingState({
      mode: "selected",
      rowId: rowId,
      columnId: columnId,
      trigger: null,
      pending: false,
      errorMessage: null
    });
  }, []);
  var startEditing = React.useCallback(function (rowId, columnId, trigger) {
    if (editingState.pending) {
      console.debug("[TaskList] ignore enter editing", {
        reason: "pending",
        rowId: rowId,
        columnId: columnId
      });
      return;
    }
    console.debug("[TaskList] enter editing", {
      rowId: rowId,
      columnId: columnId,
      trigger: trigger
    });
    setEditingState({
      mode: "editing",
      rowId: rowId,
      columnId: columnId,
      trigger: trigger,
      pending: false,
      errorMessage: null
    });
  }, [editingState.pending]);
  React.useEffect(function () {
    var previous = previousEditingStateRef.current;
    if (previous) {
      var buildLogContext = function buildLogContext() {
        var _editingState$rowId, _editingState$columnI, _editingState$trigger;
        return {
          rowId: (_editingState$rowId = editingState.rowId) != null ? _editingState$rowId : previous.rowId,
          columnId: (_editingState$columnI = editingState.columnId) != null ? _editingState$columnI : previous.columnId,
          trigger: (_editingState$trigger = editingState.trigger) != null ? _editingState$trigger : previous.trigger
        };
      };
      if (previous.mode !== "editing" && editingState.mode === "editing") {
        console.log("[edit:start]", buildLogContext());
      }
      if (!previous.pending && editingState.pending) {
        console.log("[commit:start]", buildLogContext());
      }
      if (previous.pending && !editingState.pending) {
        var logContext = buildLogContext();
        if (editingState.mode === "editing") {
          console.log("[commit:reject]", logContext);
        } else {
          console.log("[commit:resolve]", logContext);
        }
      }
      if (previous.mode === "editing" && editingState.mode !== "editing") {
        console.log("[edit:end]", _extends({}, buildLogContext(), {
          to: editingState.mode
        }));
      }
    }
    previousEditingStateRef.current = editingState;
  }, [editingState]);
  var editingContextValue = React.useMemo(function () {
    return {
      editingState: editingState,
      selectCell: selectCell,
      startEditing: startEditing
    };
  }, [editingState, selectCell, startEditing]);
  return React__default.createElement("div", {
    ref: taskListRef
  }, React__default.createElement(OverlayEditor, {
    editingState: editingState,
    taskListRef: taskListRef,
    headerContainerRef: headerRef,
    bodyContainerRef: horizontalContainerRef,
    onCommit: commitEditing,
    onCancel: cancelEditing
  }), React__default.createElement("div", {
    ref: headerRef,
    onScroll: onHorizontalScroll,
    style: {
      width: "100%",
      overflowX: "hidden"
    }
  }, React__default.createElement(TaskListHeader, Object.assign({}, headerProps))), React__default.createElement("div", {
    ref: horizontalContainerRef,
    className: horizontalContainerClass,
    style: ganttHeight ? {
      height: ganttHeight
    } : {},
    onScroll: onHorizontalScroll
  }, React__default.createElement(TaskListEditingStateContext.Provider, {
    value: editingContextValue
  }, React__default.createElement(TaskListTable, Object.assign({}, tableProps)))));
};

var TaskListHeaderDefault = function TaskListHeaderDefault(_ref) {
  var headerHeight = _ref.headerHeight,
    fontFamily = _ref.fontFamily,
    fontSize = _ref.fontSize,
    rowWidth = _ref.rowWidth,
    visibleFields = _ref.visibleFields,
    columnsState = _ref.columnsState,
    setColumnsState = _ref.setColumnsState,
    _ref$enableColumnDrag = _ref.enableColumnDrag,
    enableColumnDrag = _ref$enableColumnDrag === void 0 ? true : _ref$enableColumnDrag;
  var labels = {
    name: "タスク名",
    start: "開始日",
    end: "終了日",
    process: "工程",
    assignee: "担当者",
    plannedStart: "予定開始",
    plannedEnd: "予定終了",
    plannedEffort: "予定工数",
    actualEffort: "実績工数",
    status: "ステータス"
  };
  var fallbackColumns = resolveVisibleFields(visibleFields).map(function (field) {
    return {
      id: field,
      label: labels[field],
      width: getDefaultWidth(field, rowWidth),
      minWidth: DEFAULT_MIN_WIDTH,
      visible: true
    };
  });
  var resolvedColumns = React.useMemo(function () {
    return (columnsState || fallbackColumns).filter(function (column) {
      return column.visible !== false;
    });
  }, [columnsState, fallbackColumns]);
  var sensors = core.useSensors(core.useSensor(core.PointerSensor));
  var _useState = React.useState(null),
    resizingId = _useState[0],
    setResizingId = _useState[1];
  var onDragEnd = function onDragEnd(event) {
    if (!setColumnsState || !enableColumnDrag) return;
    var active = event.active,
      over = event.over;
    if (!over || active.id === over.id) return;
    setColumnsState(function (prev) {
      var visible = prev.filter(function (column) {
        return column.visible !== false;
      });
      var oldIndex = visible.findIndex(function (column) {
        return column.id === active.id;
      });
      var newIndex = visible.findIndex(function (column) {
        return column.id === over.id;
      });
      if (oldIndex < 0 || newIndex < 0) return prev;
      var moved = sortable.arrayMove(visible, oldIndex, newIndex);
      var idx = 0;
      return prev.map(function (column) {
        return column.visible !== false ? moved[idx++] : column;
      });
    });
  };
  var headerContent = React__default.createElement("div", {
    className: styles.ganttTable,
    style: {
      fontFamily: fontFamily,
      fontSize: fontSize
    }
  }, React__default.createElement("div", {
    className: styles.ganttTable_Header,
    style: {
      height: headerHeight - 2
    }
  }, resolvedColumns.map(function (column, index) {
    return React__default.createElement(React__default.Fragment, {
      key: column.id
    }, React__default.createElement(SortableHeaderItem, {
      column: column,
      labels: labels,
      setColumnsState: setColumnsState,
      enableDrag: enableColumnDrag && !!setColumnsState,
      setResizingId: setResizingId,
      isResizing: resizingId === column.id
    }), index !== resolvedColumns.length - 1 && React__default.createElement("div", {
      className: styles.ganttTable_HeaderSeparator,
      style: {
        height: headerHeight * 0.5,
        marginTop: headerHeight * 0.2
      }
    }));
  })));
  return React__default.createElement(core.DndContext, {
    sensors: sensors,
    onDragEnd: enableColumnDrag ? onDragEnd : undefined
  }, React__default.createElement(sortable.SortableContext, {
    items: resolvedColumns.map(function (column) {
      return column.id;
    }),
    strategy: sortable.horizontalListSortingStrategy
  }, headerContent));
};
var SortableHeaderItem = function SortableHeaderItem(_ref2) {
  var _classNames, _classNames2, _classNames3;
  var column = _ref2.column,
    labels = _ref2.labels,
    setColumnsState = _ref2.setColumnsState,
    enableDrag = _ref2.enableDrag,
    setResizingId = _ref2.setResizingId,
    isResizing = _ref2.isResizing;
  var _useSortable = sortable.useSortable({
      id: column.id,
      disabled: !enableDrag
    }),
    attributes = _useSortable.attributes,
    listeners = _useSortable.listeners,
    setNodeRef = _useSortable.setNodeRef,
    transform = _useSortable.transform,
    transition = _useSortable.transition,
    isDragging = _useSortable.isDragging;
  var startXRef = React.useRef(null);
  var startWidthRef = React.useRef(null);
  var moveHandlerRef = React.useRef(null);
  var upHandlerRef = React.useRef(null);
  React.useEffect(function () {
    return function () {
      if (moveHandlerRef.current) {
        document.removeEventListener("mousemove", moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (upHandlerRef.current) {
        document.removeEventListener("mouseup", upHandlerRef.current);
        upHandlerRef.current = null;
      }
    };
  }, []);
  var style = {
    minWidth: column.width,
    maxWidth: column.width,
    transform: utilities.CSS.Transform.toString(transform),
    transition: transition
  };
  var onMouseDownResize = function onMouseDownResize(event) {
    event.stopPropagation();
    event.preventDefault();
    startXRef.current = event.clientX;
    startWidthRef.current = column.width;
    setResizingId(column.id);
    var handleMouseMove = function handleMouseMove(moveEvent) {
      if (startXRef.current == null || startWidthRef.current == null) return;
      var delta = moveEvent.clientX - startXRef.current;
      var nextWidth = Math.max(column.minWidth, startWidthRef.current + delta);
      setColumnsState === null || setColumnsState === void 0 ? void 0 : setColumnsState(function (prev) {
        return prev.map(function (item) {
          return item.id === column.id ? _extends({}, item, {
            width: nextWidth
          }) : item;
        });
      });
    };
    var handleMouseUp = function handleMouseUp() {
      startXRef.current = null;
      startWidthRef.current = null;
      setResizingId(null);
      if (moveHandlerRef.current) {
        document.removeEventListener("mousemove", moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (upHandlerRef.current) {
        document.removeEventListener("mouseup", upHandlerRef.current);
        upHandlerRef.current = null;
      }
    };
    moveHandlerRef.current = handleMouseMove;
    upHandlerRef.current = handleMouseUp;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  return React__default.createElement("div", {
    ref: setNodeRef,
    className: classnames(styles.ganttTable_HeaderItem, (_classNames = {}, _classNames[styles.ganttTable_HeaderItemDragging] = isDragging, _classNames)),
    style: style
  }, React__default.createElement("div", Object.assign({
    className: classnames(styles.ganttTable_DragHandle, (_classNames2 = {}, _classNames2[styles.ganttTable_DragHandleDisabled] = !enableDrag, _classNames2))
  }, attributes, listeners, {
    "aria-label": "Drag column",
    onMouseDown: function onMouseDown(event) {
      return event.stopPropagation();
    }
  }), React__default.createElement("span", {
    className: styles.ganttTable_DragIcon,
    "aria-hidden": "true"
  }, "\u22EE\u22EE")), React__default.createElement("div", {
    className: styles.ganttTable_HeaderLabel
  }, labels[column.id]), React__default.createElement("div", {
    className: classnames(styles.ganttTable_ResizeHandle, (_classNames3 = {}, _classNames3[styles.ganttTable_ResizeHandleActive] = isResizing, _classNames3)),
    onMouseDown: onMouseDownResize,
    "aria-label": "Resize column",
    role: "separator",
    "aria-orientation": "vertical"
  }));
};

var TaskListTableDefault = function TaskListTableDefault(_ref) {
  var _columnsState$filter;
  var rowHeight = _ref.rowHeight,
    rowWidth = _ref.rowWidth,
    tasks = _ref.tasks,
    fontFamily = _ref.fontFamily,
    fontSize = _ref.fontSize,
    onExpanderClick = _ref.onExpanderClick,
    visibleFields = _ref.visibleFields,
    onCellCommit = _ref.onCellCommit,
    effortDisplayUnit = _ref.effortDisplayUnit,
    columnsState = _ref.columnsState;
  var columns = (_columnsState$filter = columnsState === null || columnsState === void 0 ? void 0 : columnsState.filter(function (column) {
    return column.visible !== false;
  })) != null ? _columnsState$filter : resolveVisibleFields(visibleFields).map(function (field) {
    return {
      id: field,
      width: getDefaultWidth(field, rowWidth)
    };
  });
  var isCommitEnabled = !!onCellCommit;
  var allowEditing = isCommitEnabled;
  var editingContext = React__default.useContext(TaskListEditingStateContext);
  var editingState = editingContext === null || editingContext === void 0 ? void 0 : editingContext.editingState;
  var editableFields = new Set(["name", "start", "end", "process", "assignee", "plannedStart", "plannedEnd", "plannedEffort", "actualEffort", "status"]);
  var columnIds = columns.map(function (column) {
    return typeof column === "string" ? column : column.id;
  });
  var resolveColumnId = function resolveColumnId(column) {
    return typeof column === "string" ? column : column.id;
  };
  var isCellEditable = function isCellEditable(task, columnId) {
    var tableEditable = allowEditing;
    var columnEditable = editableFields.has(columnId);
    var rowEditable = task.isDisabled !== true;
    var cellEditableByRule = true;
    return tableEditable && columnEditable && rowEditable && cellEditableByRule;
  };
  var selectCell = editingContext === null || editingContext === void 0 ? void 0 : editingContext.selectCell;
  var startEditing = editingContext === null || editingContext === void 0 ? void 0 : editingContext.startEditing;
  var findCellPosition = function findCellPosition() {
    if (!editingState || editingState.mode === "viewing") {
      return null;
    }
    var rowIndex = tasks.findIndex(function (task) {
      return task.id === editingState.rowId;
    });
    var columnIndex = columnIds.indexOf(editingState.columnId);
    if (rowIndex < 0 || columnIndex < 0) {
      return null;
    }
    return {
      rowIndex: rowIndex,
      columnIndex: columnIndex
    };
  };
  var resolveSelectedCell = function resolveSelectedCell() {
    if (!editingState || editingState.mode !== "selected") {
      return null;
    }
    var columnId = editingState.columnId;
    if (!columnId || !columnIds.includes(columnId)) {
      return null;
    }
    var task = tasks.find(function (row) {
      return row.id === editingState.rowId;
    });
    if (!task) {
      return null;
    }
    return {
      task: task,
      columnId: columnId
    };
  };
  var moveSelection = function moveSelection(direction) {
    if (!selectCell || tasks.length === 0 || columnIds.length === 0) {
      return;
    }
    var position = findCellPosition();
    if (!position) {
      var firstColumn = columnIds[0];
      selectCell(tasks[0].id, firstColumn);
      return;
    }
    var rowIndex = position.rowIndex,
      columnIndex = position.columnIndex;
    switch (direction) {
      case "up":
        rowIndex = Math.max(0, rowIndex - 1);
        break;
      case "down":
        rowIndex = Math.min(tasks.length - 1, rowIndex + 1);
        break;
      case "left":
        columnIndex = Math.max(0, columnIndex - 1);
        break;
      case "right":
        columnIndex = Math.min(columnIds.length - 1, columnIndex + 1);
        break;
    }
    selectCell(tasks[rowIndex].id, columnIds[columnIndex]);
  };
  var shouldIgnoreKeyEvent = function shouldIgnoreKeyEvent(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    var tagName = target.tagName;
    return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
  };
  var handleWrapperKeyDown = function handleWrapperKeyDown(event) {
    if (event.defaultPrevented) {
      return;
    }
    if (shouldIgnoreKeyEvent(event.target)) {
      return;
    }
    if ((editingState === null || editingState === void 0 ? void 0 : editingState.mode) === "editing") {
      return;
    }
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        moveSelection("up");
        return;
      case "ArrowDown":
        event.preventDefault();
        moveSelection("down");
        return;
      case "ArrowLeft":
        event.preventDefault();
        moveSelection("left");
        return;
      case "ArrowRight":
        event.preventDefault();
        moveSelection("right");
        return;
    }
    if ((editingState === null || editingState === void 0 ? void 0 : editingState.mode) !== "selected") {
      return;
    }
    var selectedCell = resolveSelectedCell();
    if (!selectedCell || !startEditing) {
      return;
    }
    if (event.key === "Enter") {
      if (!isCellEditable(selectedCell.task, selectedCell.columnId)) {
        console.debug("[TaskList] ignore enter editing", {
          reason: "not-editable",
          rowId: selectedCell.task.id,
          columnId: selectedCell.columnId
        });
        return;
      }
      event.preventDefault();
      startEditing(selectedCell.task.id, selectedCell.columnId, "enter");
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    var isPrintableKey = event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;
    if (isPrintableKey) {
      if (!isCellEditable(selectedCell.task, selectedCell.columnId)) {
        console.debug("[TaskList] ignore enter editing", {
          reason: "not-editable",
          rowId: selectedCell.task.id,
          columnId: selectedCell.columnId
        });
        return;
      }
      event.preventDefault();
      startEditing(selectedCell.task.id, selectedCell.columnId, "key");
    }
  };
  return React__default.createElement("div", {
    className: styles$1.taskListWrapper,
    tabIndex: 0,
    onKeyDown: handleWrapperKeyDown,
    style: {
      fontFamily: fontFamily,
      fontSize: fontSize
    }
  }, tasks.map(function (t) {
    var expanderSymbol = "";
    if (t.hideChildren === false) {
      expanderSymbol = "▼";
    } else if (t.hideChildren === true) {
      expanderSymbol = "▶";
    }
    var renderCell = function renderCell(field) {
      switch (field) {
        case "name":
          return React__default.createElement("div", {
            className: styles$1.taskListNameWrapper
          }, React__default.createElement("div", {
            className: expanderSymbol ? styles$1.taskListExpander : styles$1.taskListEmptyExpander,
            onClick: function onClick() {
              return onExpanderClick(t);
            }
          }, expanderSymbol), React__default.createElement("div", null, t.name));
        case "start":
          return React__default.createElement("span", null, formatDate(t.start));
        case "end":
          return React__default.createElement("span", null, formatDate(t.end));
        case "process":
          return React__default.createElement("span", null, normalizeProcess(t.process));
        case "assignee":
          return React__default.createElement("span", null, t.assignee || "");
        case "plannedStart":
          return React__default.createElement("span", null, formatDate(t.plannedStart));
        case "plannedEnd":
          return React__default.createElement("span", null, formatDate(t.plannedEnd));
        case "plannedEffort":
          return React__default.createElement("span", null, formatEffort(t.plannedEffort, effortDisplayUnit));
        case "actualEffort":
          return React__default.createElement("span", null, formatEffort(t.actualEffort, effortDisplayUnit));
        case "status":
          {
            var statusValue = normalizeStatus(t.status);
            return React__default.createElement("div", {
              className: styles$1.statusWrapper
            }, React__default.createElement("span", {
              className: styles$1.statusBadge,
              style: {
                backgroundColor: getStatusColor(statusValue)
              }
            }, getStatusBadgeText(statusValue)), React__default.createElement("span", {
              className: styles$1.statusText
            }, statusValue));
          }
        default:
          return null;
      }
    };
    return React__default.createElement("div", {
      className: styles$1.taskListTableRow,
      style: {
        height: rowHeight
      },
      key: t.id + "row"
    }, columns.map(function (column) {
      var columnId = resolveColumnId(column);
      var isSelected = (editingState === null || editingState === void 0 ? void 0 : editingState.mode) !== "viewing" && (editingState === null || editingState === void 0 ? void 0 : editingState.rowId) === t.id && (editingState === null || editingState === void 0 ? void 0 : editingState.columnId) === columnId;
      var handleCellClick = function handleCellClick(event) {
        if ((editingState === null || editingState === void 0 ? void 0 : editingState.mode) === "editing") {
          var pending = editingState.pending;
          console.log("[edit:select]", {
            rowId: t.id,
            columnId: columnId,
            pending: pending
          });
          if (pending) {
            return;
          }
        }
        if (selectCell) {
          selectCell(t.id, columnId);
        }
        event.currentTarget.focus();
      };
      var handleCellDoubleClick = function handleCellDoubleClick() {
        if (!startEditing) {
          return;
        }
        if (!isCellEditable(t, columnId)) {
          console.debug("[TaskList] ignore enter editing", {
            reason: "not-editable",
            rowId: t.id,
            columnId: columnId
          });
          return;
        }
        startEditing(t.id, columnId, "dblclick");
      };
      var handleCellKeyDown = function handleCellKeyDown(event) {
        if (shouldIgnoreKeyEvent(event.target)) {
          return;
        }
        if (!isSelected || (editingState === null || editingState === void 0 ? void 0 : editingState.mode) !== "selected") {
          return;
        }
        if (event.key === "Enter") {
          if (!startEditing) {
            return;
          }
          if (!isCellEditable(t, columnId)) {
            console.debug("[TaskList] ignore enter editing", {
              reason: "not-editable",
              rowId: t.id,
              columnId: columnId
            });
            return;
          }
          event.preventDefault();
          startEditing(t.id, columnId, "enter");
          return;
        }
        if (event.key === "Escape") {
          return;
        }
        var isPrintableKey = event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;
        if (isPrintableKey) {
          if (!startEditing) {
            return;
          }
          if (!isCellEditable(t, columnId)) {
            console.debug("[TaskList] ignore enter editing", {
              reason: "not-editable",
              rowId: t.id,
              columnId: columnId
            });
            return;
          }
          event.preventDefault();
          startEditing(t.id, columnId, "key");
        }
      };
      return React__default.createElement("div", {
        key: t.id + "-" + columnId,
        className: styles$1.taskListCell,
        "data-row-id": t.id,
        "data-column-id": columnId,
        "aria-selected": isSelected || undefined,
        tabIndex: isSelected ? 0 : -1,
        onClick: handleCellClick,
        onDoubleClick: handleCellDoubleClick,
        onKeyDown: handleCellKeyDown,
        style: {
          minWidth: typeof column === "string" ? rowWidth : column.width + "px",
          maxWidth: typeof column === "string" ? rowWidth : column.width + "px"
        },
        title: columnId === "name" ? t.name : undefined
      }, renderCell(columnId));
    }));
  }));
};

var styles$2 = {"tooltipDefaultContainer":"_3T42e","tooltipDefaultContainerParagraph":"_29NTg","tooltipTitle":"_OlR7X","tooltipName":"_1LUF2","tooltipDate":"_18-nf","tooltipRow":"_2rDF0","tooltipLabel":"_2vh4d","tooltipValue":"_2HKiU","tooltipStatus":"_2Vw2t","tooltipStatusText":"_33_nk","tooltipDetailsContainer":"_25P-K","tooltipDetailsContainerHidden":"_3gVAq"};

var Tooltip = function Tooltip(_ref) {
  var task = _ref.task,
    rowHeight = _ref.rowHeight,
    rtl = _ref.rtl,
    svgContainerHeight = _ref.svgContainerHeight,
    svgContainerWidth = _ref.svgContainerWidth,
    scrollX = _ref.scrollX,
    scrollY = _ref.scrollY,
    arrowIndent = _ref.arrowIndent,
    fontSize = _ref.fontSize,
    fontFamily = _ref.fontFamily,
    headerHeight = _ref.headerHeight,
    taskListWidth = _ref.taskListWidth,
    TooltipContent = _ref.TooltipContent,
    effortDisplayUnit = _ref.effortDisplayUnit;
  var tooltipRef = React.useRef(null);
  var _useState = React.useState(0),
    relatedY = _useState[0],
    setRelatedY = _useState[1];
  var _useState2 = React.useState(0),
    relatedX = _useState2[0],
    setRelatedX = _useState2[1];
  React.useEffect(function () {
    if (tooltipRef.current) {
      var tooltipHeight = tooltipRef.current.offsetHeight * 1.1;
      var tooltipWidth = tooltipRef.current.offsetWidth * 1.1;
      var newRelatedY = task.index * rowHeight - scrollY + headerHeight;
      var newRelatedX;
      if (rtl) {
        newRelatedX = task.x1 - arrowIndent * 1.5 - tooltipWidth - scrollX;
        if (newRelatedX < 0) {
          newRelatedX = task.x2 + arrowIndent * 1.5 - scrollX;
        }
        var tooltipLeftmostPoint = tooltipWidth + newRelatedX;
        if (tooltipLeftmostPoint > svgContainerWidth) {
          newRelatedX = svgContainerWidth - tooltipWidth;
          newRelatedY += rowHeight;
        }
      } else {
        newRelatedX = task.x2 + arrowIndent * 1.5 + taskListWidth - scrollX;
        var _tooltipLeftmostPoint = tooltipWidth + newRelatedX;
        var fullChartWidth = taskListWidth + svgContainerWidth;
        if (_tooltipLeftmostPoint > fullChartWidth) {
          newRelatedX = task.x1 + taskListWidth - arrowIndent * 1.5 - scrollX - tooltipWidth;
        }
        if (newRelatedX < taskListWidth) {
          newRelatedX = svgContainerWidth + taskListWidth - tooltipWidth;
          newRelatedY += rowHeight;
        }
      }
      var tooltipLowerPoint = tooltipHeight + newRelatedY - scrollY;
      if (tooltipLowerPoint > svgContainerHeight - scrollY) {
        newRelatedY = svgContainerHeight - tooltipHeight;
      }
      setRelatedY(newRelatedY);
      setRelatedX(newRelatedX);
    }
  }, [tooltipRef, task, arrowIndent, scrollX, scrollY, headerHeight, taskListWidth, rowHeight, svgContainerHeight, svgContainerWidth, rtl]);
  return React__default.createElement("div", {
    ref: tooltipRef,
    className: relatedX ? styles$2.tooltipDetailsContainer : styles$2.tooltipDetailsContainerHidden,
    style: {
      left: relatedX,
      top: relatedY
    }
  }, React__default.createElement(TooltipContent, {
    task: task,
    fontSize: fontSize,
    fontFamily: fontFamily,
    effortDisplayUnit: effortDisplayUnit
  }));
};
var StandardTooltipContent = function StandardTooltipContent(_ref2) {
  var task = _ref2.task,
    fontSize = _ref2.fontSize,
    fontFamily = _ref2.fontFamily,
    _ref2$effortDisplayUn = _ref2.effortDisplayUnit,
    effortDisplayUnit = _ref2$effortDisplayUn === void 0 ? "MH" : _ref2$effortDisplayUn;
  var style = {
    fontSize: fontSize,
    fontFamily: fontFamily
  };
  var normalizedStatus = normalizeStatus(task.status);
  var normalizedProcess = normalizeProcess(task.process);
  var dateRange = formatDate(task.start) + " \u301C " + formatDate(task.end);
  var plannedRange = task.plannedStart || task.plannedEnd ? formatDate(task.plannedStart) + " \u301C " + formatDate(task.plannedEnd) : "";
  var plannedEffort = formatEffort(task.plannedEffort, effortDisplayUnit);
  var actualEffort = formatEffort(task.actualEffort, effortDisplayUnit);
  return React__default.createElement("div", {
    className: styles$2.tooltipDefaultContainer,
    style: style
  }, React__default.createElement("div", {
    className: styles$2.tooltipTitle
  }, React__default.createElement("b", {
    className: styles$2.tooltipName
  }, task.name), React__default.createElement("span", {
    className: styles$2.tooltipDate
  }, dateRange)), React__default.createElement("div", {
    className: styles$2.tooltipRow
  }, React__default.createElement("span", {
    className: styles$2.tooltipLabel
  }, "\u5DE5\u7A0B"), React__default.createElement("span", {
    className: styles$2.tooltipValue
  }, normalizedProcess)), React__default.createElement("div", {
    className: styles$2.tooltipRow
  }, React__default.createElement("span", {
    className: styles$2.tooltipLabel
  }, "\u62C5\u5F53"), React__default.createElement("span", {
    className: styles$2.tooltipValue
  }, task.assignee || "-")), plannedRange && React__default.createElement("div", {
    className: styles$2.tooltipRow
  }, React__default.createElement("span", {
    className: styles$2.tooltipLabel
  }, "\u4E88\u5B9A"), React__default.createElement("span", {
    className: styles$2.tooltipValue
  }, plannedRange)), plannedEffort && React__default.createElement("div", {
    className: styles$2.tooltipRow
  }, React__default.createElement("span", {
    className: styles$2.tooltipLabel
  }, "\u4E88\u5B9A\u5DE5\u6570"), React__default.createElement("span", {
    className: styles$2.tooltipValue
  }, plannedEffort)), actualEffort && React__default.createElement("div", {
    className: styles$2.tooltipRow
  }, React__default.createElement("span", {
    className: styles$2.tooltipLabel
  }, "\u5B9F\u7E3E\u5DE5\u6570"), React__default.createElement("span", {
    className: styles$2.tooltipValue
  }, actualEffort)), React__default.createElement("div", {
    className: styles$2.tooltipRow
  }, React__default.createElement("span", {
    className: styles$2.tooltipLabel
  }, "\u30B9\u30C6\u30FC\u30BF\u30B9"), React__default.createElement("span", {
    className: styles$2.tooltipValue
  }, React__default.createElement("span", {
    className: styles$2.tooltipStatus,
    style: {
      backgroundColor: getStatusColor(normalizedStatus)
    }
  }, getStatusBadgeText(normalizedStatus)), React__default.createElement("span", {
    className: styles$2.tooltipStatusText
  }, normalizedStatus))), !!task.progress && React__default.createElement("p", {
    className: styles$2.tooltipDefaultContainerParagraph
  }, "\u9032\u6357\u7387: ", task.progress, " %"));
};

var styles$3 = {"scroll":"_1eT-t"};

var VerticalScroll = function VerticalScroll(_ref) {
  var scroll = _ref.scroll,
    ganttHeight = _ref.ganttHeight,
    ganttFullHeight = _ref.ganttFullHeight,
    headerHeight = _ref.headerHeight,
    rtl = _ref.rtl,
    onScroll = _ref.onScroll;
  var scrollRef = React.useRef(null);
  React.useEffect(function () {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scroll;
    }
  }, [scroll]);
  return React__default.createElement("div", {
    style: {
      position: "absolute",
      top: headerHeight,
      height: ganttHeight,
      right: rtl ? undefined : 0,
      left: rtl ? 0 : undefined
    },
    className: styles$3.scroll,
    onScroll: onScroll,
    ref: scrollRef
  }, React__default.createElement("div", {
    style: {
      height: ganttFullHeight,
      width: 1
    }
  }));
};

var styles$4 = {"gridRow":"_2dZTy","gridRowLine":"_3rUKi","gridTick":"_RuwuK"};

var GridBody = function GridBody(_ref) {
  var tasks = _ref.tasks,
    dates = _ref.dates,
    rowHeight = _ref.rowHeight,
    svgWidth = _ref.svgWidth,
    columnWidth = _ref.columnWidth,
    todayColor = _ref.todayColor,
    rtl = _ref.rtl;
  var y = 0;
  var gridRows = [];
  var rowLines = [React__default.createElement("line", {
    key: "RowLineFirst",
    x: "0",
    y1: 0,
    x2: svgWidth,
    y2: 0,
    className: styles$4.gridRowLine
  })];
  for (var _iterator = _createForOfIteratorHelperLoose(tasks), _step; !(_step = _iterator()).done;) {
    var task = _step.value;
    gridRows.push(React__default.createElement("rect", {
      key: "Row" + task.id,
      x: "0",
      y: y,
      width: svgWidth,
      height: rowHeight,
      className: styles$4.gridRow
    }));
    rowLines.push(React__default.createElement("line", {
      key: "RowLine" + task.id,
      x: "0",
      y1: y + rowHeight,
      x2: svgWidth,
      y2: y + rowHeight,
      className: styles$4.gridRowLine
    }));
    y += rowHeight;
  }
  var now = new Date();
  var tickX = 0;
  var ticks = [];
  var today = React__default.createElement("rect", null);
  for (var i = 0; i < dates.length; i++) {
    var date = dates[i];
    ticks.push(React__default.createElement("line", {
      key: date.getTime(),
      x1: tickX,
      y1: 0,
      x2: tickX,
      y2: y,
      className: styles$4.gridTick
    }));
    if (i + 1 !== dates.length && date.getTime() < now.getTime() && dates[i + 1].getTime() >= now.getTime() || i !== 0 && i + 1 === dates.length && date.getTime() < now.getTime() && addToDate(date, date.getTime() - dates[i - 1].getTime(), "millisecond").getTime() >= now.getTime()) {
      today = React__default.createElement("rect", {
        x: tickX,
        y: 0,
        width: columnWidth,
        height: y,
        fill: todayColor
      });
    }
    if (rtl && i + 1 !== dates.length && date.getTime() >= now.getTime() && dates[i + 1].getTime() < now.getTime()) {
      today = React__default.createElement("rect", {
        x: tickX + columnWidth,
        y: 0,
        width: columnWidth,
        height: y,
        fill: todayColor
      });
    }
    tickX += columnWidth;
  }
  return React__default.createElement("g", {
    className: "gridBody"
  }, React__default.createElement("g", {
    className: "rows"
  }, gridRows), React__default.createElement("g", {
    className: "rowLines"
  }, rowLines), React__default.createElement("g", {
    className: "ticks"
  }, ticks), React__default.createElement("g", {
    className: "today"
  }, today));
};

var Grid = function Grid(props) {
  return React__default.createElement("g", {
    className: "grid"
  }, React__default.createElement(GridBody, Object.assign({}, props)));
};

var styles$5 = {"calendarBottomText":"_9w8d5","calendarTopTick":"_1rLuZ","calendarTopText":"_2q1Kt","calendarHeader":"_35nLX"};

var TopPartOfCalendar = function TopPartOfCalendar(_ref) {
  var value = _ref.value,
    x1Line = _ref.x1Line,
    y1Line = _ref.y1Line,
    y2Line = _ref.y2Line,
    xText = _ref.xText,
    yText = _ref.yText;
  return React__default.createElement("g", {
    className: "calendarTop"
  }, React__default.createElement("line", {
    x1: x1Line,
    y1: y1Line,
    x2: x1Line,
    y2: y2Line,
    className: styles$5.calendarTopTick,
    key: value + "line"
  }), React__default.createElement("text", {
    key: value + "text",
    y: yText,
    x: xText,
    className: styles$5.calendarTopText
  }, value));
};

var Calendar = function Calendar(_ref) {
  var dateSetup = _ref.dateSetup,
    locale = _ref.locale,
    viewMode = _ref.viewMode,
    rtl = _ref.rtl,
    headerHeight = _ref.headerHeight,
    columnWidth = _ref.columnWidth,
    fontFamily = _ref.fontFamily,
    fontSize = _ref.fontSize;
  var getCalendarValuesForYear = function getCalendarValuesForYear() {
    var topValues = [];
    var bottomValues = [];
    var topDefaultHeight = headerHeight * 0.5;
    for (var i = 0; i < dateSetup.dates.length; i++) {
      var date = dateSetup.dates[i];
      var bottomValue = date.getFullYear();
      bottomValues.push(React__default.createElement("text", {
        key: date.getTime(),
        y: headerHeight * 0.8,
        x: columnWidth * i + columnWidth * 0.5,
        className: styles$5.calendarBottomText
      }, bottomValue));
      if (i === 0 || date.getFullYear() !== dateSetup.dates[i - 1].getFullYear()) {
        var topValue = date.getFullYear().toString();
        var xText = void 0;
        if (rtl) {
          xText = (6 + i + date.getFullYear() + 1) * columnWidth;
        } else {
          xText = (6 + i - date.getFullYear()) * columnWidth;
        }
        topValues.push(React__default.createElement(TopPartOfCalendar, {
          key: topValue,
          value: topValue,
          x1Line: columnWidth * i,
          y1Line: 0,
          y2Line: headerHeight,
          xText: xText,
          yText: topDefaultHeight * 0.9
        }));
      }
    }
    return [topValues, bottomValues];
  };
  var getCalendarValuesForQuarterYear = function getCalendarValuesForQuarterYear() {
    var topValues = [];
    var bottomValues = [];
    var topDefaultHeight = headerHeight * 0.5;
    for (var i = 0; i < dateSetup.dates.length; i++) {
      var date = dateSetup.dates[i];
      var quarter = "Q" + Math.floor((date.getMonth() + 3) / 3);
      bottomValues.push(React__default.createElement("text", {
        key: date.getTime(),
        y: headerHeight * 0.8,
        x: columnWidth * i + columnWidth * 0.5,
        className: styles$5.calendarBottomText
      }, quarter));
      if (i === 0 || date.getFullYear() !== dateSetup.dates[i - 1].getFullYear()) {
        var topValue = date.getFullYear().toString();
        var xText = void 0;
        if (rtl) {
          xText = (6 + i + date.getMonth() + 1) * columnWidth;
        } else {
          xText = (6 + i - date.getMonth()) * columnWidth;
        }
        topValues.push(React__default.createElement(TopPartOfCalendar, {
          key: topValue,
          value: topValue,
          x1Line: columnWidth * i,
          y1Line: 0,
          y2Line: topDefaultHeight,
          xText: Math.abs(xText),
          yText: topDefaultHeight * 0.9
        }));
      }
    }
    return [topValues, bottomValues];
  };
  var getCalendarValuesForMonth = function getCalendarValuesForMonth() {
    var topValues = [];
    var bottomValues = [];
    var topDefaultHeight = headerHeight * 0.5;
    for (var i = 0; i < dateSetup.dates.length; i++) {
      var date = dateSetup.dates[i];
      var bottomValue = getLocaleMonth(date, locale);
      bottomValues.push(React__default.createElement("text", {
        key: bottomValue + date.getFullYear(),
        y: headerHeight * 0.8,
        x: columnWidth * i + columnWidth * 0.5,
        className: styles$5.calendarBottomText
      }, bottomValue));
      if (i === 0 || date.getFullYear() !== dateSetup.dates[i - 1].getFullYear()) {
        var topValue = date.getFullYear().toString();
        var xText = void 0;
        if (rtl) {
          xText = (6 + i + date.getMonth() + 1) * columnWidth;
        } else {
          xText = (6 + i - date.getMonth()) * columnWidth;
        }
        topValues.push(React__default.createElement(TopPartOfCalendar, {
          key: topValue,
          value: topValue,
          x1Line: columnWidth * i,
          y1Line: 0,
          y2Line: topDefaultHeight,
          xText: xText,
          yText: topDefaultHeight * 0.9
        }));
      }
    }
    return [topValues, bottomValues];
  };
  var getCalendarValuesForWeek = function getCalendarValuesForWeek() {
    var topValues = [];
    var bottomValues = [];
    var weeksCount = 1;
    var topDefaultHeight = headerHeight * 0.5;
    var dates = dateSetup.dates;
    for (var i = dates.length - 1; i >= 0; i--) {
      var date = dates[i];
      var topValue = "";
      if (i === 0 || date.getMonth() !== dates[i - 1].getMonth()) {
        topValue = getLocaleMonth(date, locale) + ", " + date.getFullYear();
      }
      var bottomValue = "W" + getWeekNumberISO8601(date);
      bottomValues.push(React__default.createElement("text", {
        key: date.getTime(),
        y: headerHeight * 0.8,
        x: columnWidth * (i + +rtl),
        className: styles$5.calendarBottomText
      }, bottomValue));
      if (topValue) {
        if (i !== dates.length - 1) {
          topValues.push(React__default.createElement(TopPartOfCalendar, {
            key: topValue,
            value: topValue,
            x1Line: columnWidth * i + weeksCount * columnWidth,
            y1Line: 0,
            y2Line: topDefaultHeight,
            xText: columnWidth * i + columnWidth * weeksCount * 0.5,
            yText: topDefaultHeight * 0.9
          }));
        }
        weeksCount = 0;
      }
      weeksCount++;
    }
    return [topValues, bottomValues];
  };
  var getCalendarValuesForDay = function getCalendarValuesForDay() {
    var topValues = [];
    var bottomValues = [];
    var topDefaultHeight = headerHeight * 0.5;
    var dates = dateSetup.dates;
    for (var i = 0; i < dates.length; i++) {
      var date = dates[i];
      var bottomValue = getLocalDayOfWeek(date, locale, "short") + ", " + date.getDate().toString();
      bottomValues.push(React__default.createElement("text", {
        key: date.getTime(),
        y: headerHeight * 0.8,
        x: columnWidth * i + columnWidth * 0.5,
        className: styles$5.calendarBottomText
      }, bottomValue));
      if (i + 1 !== dates.length && date.getMonth() !== dates[i + 1].getMonth()) {
        var topValue = getLocaleMonth(date, locale);
        topValues.push(React__default.createElement(TopPartOfCalendar, {
          key: topValue + date.getFullYear(),
          value: topValue,
          x1Line: columnWidth * (i + 1),
          y1Line: 0,
          y2Line: topDefaultHeight,
          xText: columnWidth * (i + 1) - getDaysInMonth(date.getMonth(), date.getFullYear()) * columnWidth * 0.5,
          yText: topDefaultHeight * 0.9
        }));
      }
    }
    return [topValues, bottomValues];
  };
  var getCalendarValuesForPartOfDay = function getCalendarValuesForPartOfDay() {
    var topValues = [];
    var bottomValues = [];
    var ticks = viewMode === exports.ViewMode.HalfDay ? 2 : 4;
    var topDefaultHeight = headerHeight * 0.5;
    var dates = dateSetup.dates;
    for (var i = 0; i < dates.length; i++) {
      var date = dates[i];
      var bottomValue = getCachedDateTimeFormat(locale, {
        hour: "numeric"
      }).format(date);
      bottomValues.push(React__default.createElement("text", {
        key: date.getTime(),
        y: headerHeight * 0.8,
        x: columnWidth * (i + +rtl),
        className: styles$5.calendarBottomText,
        fontFamily: fontFamily
      }, bottomValue));
      if (i === 0 || date.getDate() !== dates[i - 1].getDate()) {
        var topValue = getLocalDayOfWeek(date, locale, "short") + ", " + date.getDate() + " " + getLocaleMonth(date, locale);
        topValues.push(React__default.createElement(TopPartOfCalendar, {
          key: topValue + date.getFullYear(),
          value: topValue,
          x1Line: columnWidth * i + ticks * columnWidth,
          y1Line: 0,
          y2Line: topDefaultHeight,
          xText: columnWidth * i + ticks * columnWidth * 0.5,
          yText: topDefaultHeight * 0.9
        }));
      }
    }
    return [topValues, bottomValues];
  };
  var getCalendarValuesForHour = function getCalendarValuesForHour() {
    var topValues = [];
    var bottomValues = [];
    var topDefaultHeight = headerHeight * 0.5;
    var dates = dateSetup.dates;
    for (var i = 0; i < dates.length; i++) {
      var date = dates[i];
      var bottomValue = getCachedDateTimeFormat(locale, {
        hour: "numeric"
      }).format(date);
      bottomValues.push(React__default.createElement("text", {
        key: date.getTime(),
        y: headerHeight * 0.8,
        x: columnWidth * (i + +rtl),
        className: styles$5.calendarBottomText,
        fontFamily: fontFamily
      }, bottomValue));
      if (i !== 0 && date.getDate() !== dates[i - 1].getDate()) {
        var displayDate = dates[i - 1];
        var topValue = getLocalDayOfWeek(displayDate, locale, "long") + ", " + displayDate.getDate() + " " + getLocaleMonth(displayDate, locale);
        var topPosition = (date.getHours() - 24) / 2;
        topValues.push(React__default.createElement(TopPartOfCalendar, {
          key: topValue + displayDate.getFullYear(),
          value: topValue,
          x1Line: columnWidth * i,
          y1Line: 0,
          y2Line: topDefaultHeight,
          xText: columnWidth * (i + topPosition),
          yText: topDefaultHeight * 0.9
        }));
      }
    }
    return [topValues, bottomValues];
  };
  var topValues = [];
  var bottomValues = [];
  switch (dateSetup.viewMode) {
    case exports.ViewMode.Year:
      var _getCalendarValuesFor = getCalendarValuesForYear();
      topValues = _getCalendarValuesFor[0];
      bottomValues = _getCalendarValuesFor[1];
      break;
    case exports.ViewMode.QuarterYear:
      var _getCalendarValuesFor2 = getCalendarValuesForQuarterYear();
      topValues = _getCalendarValuesFor2[0];
      bottomValues = _getCalendarValuesFor2[1];
      break;
    case exports.ViewMode.Month:
      var _getCalendarValuesFor3 = getCalendarValuesForMonth();
      topValues = _getCalendarValuesFor3[0];
      bottomValues = _getCalendarValuesFor3[1];
      break;
    case exports.ViewMode.Week:
      var _getCalendarValuesFor4 = getCalendarValuesForWeek();
      topValues = _getCalendarValuesFor4[0];
      bottomValues = _getCalendarValuesFor4[1];
      break;
    case exports.ViewMode.Day:
      var _getCalendarValuesFor5 = getCalendarValuesForDay();
      topValues = _getCalendarValuesFor5[0];
      bottomValues = _getCalendarValuesFor5[1];
      break;
    case exports.ViewMode.QuarterDay:
    case exports.ViewMode.HalfDay:
      var _getCalendarValuesFor6 = getCalendarValuesForPartOfDay();
      topValues = _getCalendarValuesFor6[0];
      bottomValues = _getCalendarValuesFor6[1];
      break;
    case exports.ViewMode.Hour:
      var _getCalendarValuesFor7 = getCalendarValuesForHour();
      topValues = _getCalendarValuesFor7[0];
      bottomValues = _getCalendarValuesFor7[1];
  }
  return React__default.createElement("g", {
    className: "calendar",
    fontSize: fontSize,
    fontFamily: fontFamily
  }, React__default.createElement("rect", {
    x: 0,
    y: 0,
    width: columnWidth * dateSetup.dates.length,
    height: headerHeight,
    className: styles$5.calendarHeader
  }), bottomValues, " ", topValues);
};

var Arrow = function Arrow(_ref) {
  var taskFrom = _ref.taskFrom,
    taskTo = _ref.taskTo,
    rowHeight = _ref.rowHeight,
    taskHeight = _ref.taskHeight,
    arrowIndent = _ref.arrowIndent,
    rtl = _ref.rtl;
  var path;
  var trianglePoints;
  if (rtl) {
    var _drownPathAndTriangle = drownPathAndTriangleRTL(taskFrom, taskTo, rowHeight, taskHeight, arrowIndent);
    path = _drownPathAndTriangle[0];
    trianglePoints = _drownPathAndTriangle[1];
  } else {
    var _drownPathAndTriangle2 = drownPathAndTriangle(taskFrom, taskTo, rowHeight, taskHeight, arrowIndent);
    path = _drownPathAndTriangle2[0];
    trianglePoints = _drownPathAndTriangle2[1];
  }
  return React__default.createElement("g", {
    className: "arrow"
  }, React__default.createElement("path", {
    strokeWidth: "1.5",
    d: path,
    fill: "none"
  }), React__default.createElement("polygon", {
    points: trianglePoints
  }));
};
var drownPathAndTriangle = function drownPathAndTriangle(taskFrom, taskTo, rowHeight, taskHeight, arrowIndent) {
  var indexCompare = taskFrom.index > taskTo.index ? -1 : 1;
  var taskToEndPosition = taskTo.y + taskHeight / 2;
  var taskFromEndPosition = taskFrom.x2 + arrowIndent * 2;
  var taskFromHorizontalOffsetValue = taskFromEndPosition < taskTo.x1 ? "" : "H " + (taskTo.x1 - arrowIndent);
  var taskToHorizontalOffsetValue = taskFromEndPosition > taskTo.x1 ? arrowIndent : taskTo.x1 - taskFrom.x2 - arrowIndent;
  var path = "M " + taskFrom.x2 + " " + (taskFrom.y + taskHeight / 2) + " \n  h " + arrowIndent + " \n  v " + indexCompare * rowHeight / 2 + " \n  " + taskFromHorizontalOffsetValue + "\n  V " + taskToEndPosition + " \n  h " + taskToHorizontalOffsetValue;
  var trianglePoints = taskTo.x1 + "," + taskToEndPosition + " \n  " + (taskTo.x1 - 5) + "," + (taskToEndPosition - 5) + " \n  " + (taskTo.x1 - 5) + "," + (taskToEndPosition + 5);
  return [path, trianglePoints];
};
var drownPathAndTriangleRTL = function drownPathAndTriangleRTL(taskFrom, taskTo, rowHeight, taskHeight, arrowIndent) {
  var indexCompare = taskFrom.index > taskTo.index ? -1 : 1;
  var taskToEndPosition = taskTo.y + taskHeight / 2;
  var taskFromEndPosition = taskFrom.x1 - arrowIndent * 2;
  var taskFromHorizontalOffsetValue = taskFromEndPosition > taskTo.x2 ? "" : "H " + (taskTo.x2 + arrowIndent);
  var taskToHorizontalOffsetValue = taskFromEndPosition < taskTo.x2 ? -arrowIndent : taskTo.x2 - taskFrom.x1 + arrowIndent;
  var path = "M " + taskFrom.x1 + " " + (taskFrom.y + taskHeight / 2) + " \n  h " + -arrowIndent + " \n  v " + indexCompare * rowHeight / 2 + " \n  " + taskFromHorizontalOffsetValue + "\n  V " + taskToEndPosition + " \n  h " + taskToHorizontalOffsetValue;
  var trianglePoints = taskTo.x2 + "," + taskToEndPosition + " \n  " + (taskTo.x2 + 5) + "," + (taskToEndPosition + 5) + " \n  " + (taskTo.x2 + 5) + "," + (taskToEndPosition - 5);
  return [path, trianglePoints];
};

var convertToBarTasks = function convertToBarTasks(tasks, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, rtl, barProgressColor, barProgressSelectedColor, barBackgroundColor, barBackgroundSelectedColor, projectProgressColor, projectProgressSelectedColor, projectBackgroundColor, projectBackgroundSelectedColor, milestoneBackgroundColor, milestoneBackgroundSelectedColor) {
  var barTasks = tasks.map(function (t, i) {
    return convertToBarTask(t, i, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, rtl, barProgressColor, barProgressSelectedColor, barBackgroundColor, barBackgroundSelectedColor, projectProgressColor, projectProgressSelectedColor, projectBackgroundColor, projectBackgroundSelectedColor, milestoneBackgroundColor, milestoneBackgroundSelectedColor);
  });
  barTasks = barTasks.map(function (task) {
    var dependencies = task.dependencies || [];
    var _loop = function _loop(j) {
      var dependence = barTasks.findIndex(function (value) {
        return value.id === dependencies[j];
      });
      if (dependence !== -1) barTasks[dependence].barChildren.push(task);
    };
    for (var j = 0; j < dependencies.length; j++) {
      _loop(j);
    }
    return task;
  });
  return barTasks;
};
var convertToBarTask = function convertToBarTask(task, index, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, rtl, barProgressColor, barProgressSelectedColor, barBackgroundColor, barBackgroundSelectedColor, projectProgressColor, projectProgressSelectedColor, projectBackgroundColor, projectBackgroundSelectedColor, milestoneBackgroundColor, milestoneBackgroundSelectedColor) {
  var barTask;
  switch (task.type) {
    case "milestone":
      barTask = convertToMilestone(task, index, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, milestoneBackgroundColor, milestoneBackgroundSelectedColor);
      break;
    case "project":
      barTask = convertToBar(task, index, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, rtl, projectProgressColor, projectProgressSelectedColor, projectBackgroundColor, projectBackgroundSelectedColor);
      break;
    default:
      barTask = convertToBar(task, index, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, rtl, barProgressColor, barProgressSelectedColor, barBackgroundColor, barBackgroundSelectedColor);
      break;
  }
  return barTask;
};
var convertToBar = function convertToBar(task, index, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, rtl, barProgressColor, barProgressSelectedColor, barBackgroundColor, barBackgroundSelectedColor) {
  var x1;
  var x2;
  if (rtl) {
    x2 = taskXCoordinateRTL(task.start, dates, columnWidth);
    x1 = taskXCoordinateRTL(task.end, dates, columnWidth);
  } else {
    x1 = taskXCoordinate(task.start, dates, columnWidth);
    x2 = taskXCoordinate(task.end, dates, columnWidth);
  }
  var typeInternal = task.type;
  if (typeInternal === "task" && x2 - x1 < handleWidth * 2) {
    typeInternal = "smalltask";
    x2 = x1 + handleWidth * 2;
  }
  var _progressWithByParams = progressWithByParams(x1, x2, task.progress, rtl),
    progressWidth = _progressWithByParams[0],
    progressX = _progressWithByParams[1];
  var y = taskYCoordinate(index, rowHeight, taskHeight);
  var hideChildren = task.type === "project" ? task.hideChildren : undefined;
  var styles = _extends({
    backgroundColor: barBackgroundColor,
    backgroundSelectedColor: barBackgroundSelectedColor,
    progressColor: barProgressColor,
    progressSelectedColor: barProgressSelectedColor
  }, task.styles);
  return _extends({}, task, {
    typeInternal: typeInternal,
    x1: x1,
    x2: x2,
    y: y,
    index: index,
    progressX: progressX,
    progressWidth: progressWidth,
    barCornerRadius: barCornerRadius,
    handleWidth: handleWidth,
    hideChildren: hideChildren,
    height: taskHeight,
    barChildren: [],
    styles: styles
  });
};
var convertToMilestone = function convertToMilestone(task, index, dates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, milestoneBackgroundColor, milestoneBackgroundSelectedColor) {
  var x = taskXCoordinate(task.start, dates, columnWidth);
  var y = taskYCoordinate(index, rowHeight, taskHeight);
  var x1 = x - taskHeight * 0.5;
  var x2 = x + taskHeight * 0.5;
  var rotatedHeight = taskHeight / 1.414;
  var styles = _extends({
    backgroundColor: milestoneBackgroundColor,
    backgroundSelectedColor: milestoneBackgroundSelectedColor,
    progressColor: "",
    progressSelectedColor: ""
  }, task.styles);
  return _extends({}, task, {
    end: task.start,
    x1: x1,
    x2: x2,
    y: y,
    index: index,
    progressX: 0,
    progressWidth: 0,
    barCornerRadius: barCornerRadius,
    handleWidth: handleWidth,
    typeInternal: task.type,
    progress: 0,
    height: rotatedHeight,
    hideChildren: undefined,
    barChildren: [],
    styles: styles
  });
};
var taskXCoordinate = function taskXCoordinate(xDate, dates, columnWidth) {
  var index = dates.findIndex(function (d) {
    return d.getTime() >= xDate.getTime();
  }) - 1;
  var remainderMillis = xDate.getTime() - dates[index].getTime();
  var percentOfInterval = remainderMillis / (dates[index + 1].getTime() - dates[index].getTime());
  var x = index * columnWidth + percentOfInterval * columnWidth;
  return x;
};
var taskXCoordinateRTL = function taskXCoordinateRTL(xDate, dates, columnWidth) {
  var x = taskXCoordinate(xDate, dates, columnWidth);
  x += columnWidth;
  return x;
};
var taskYCoordinate = function taskYCoordinate(index, rowHeight, taskHeight) {
  var y = index * rowHeight + (rowHeight - taskHeight) / 2;
  return y;
};
var progressWithByParams = function progressWithByParams(taskX1, taskX2, progress, rtl) {
  var progressWidth = (taskX2 - taskX1) * progress * 0.01;
  var progressX;
  if (rtl) {
    progressX = taskX2 - progressWidth;
  } else {
    progressX = taskX1;
  }
  return [progressWidth, progressX];
};
var progressByX = function progressByX(x, task) {
  if (x >= task.x2) return 100;else if (x <= task.x1) return 0;else {
    var barWidth = task.x2 - task.x1;
    var progressPercent = Math.round((x - task.x1) * 100 / barWidth);
    return progressPercent;
  }
};
var progressByXRTL = function progressByXRTL(x, task) {
  if (x >= task.x2) return 0;else if (x <= task.x1) return 100;else {
    var barWidth = task.x2 - task.x1;
    var progressPercent = Math.round((task.x2 - x) * 100 / barWidth);
    return progressPercent;
  }
};
var getProgressPoint = function getProgressPoint(progressX, taskY, taskHeight) {
  var point = [progressX - 5, taskY + taskHeight, progressX + 5, taskY + taskHeight, progressX, taskY + taskHeight - 8.66];
  return point.join(",");
};
var startByX = function startByX(x, xStep, task) {
  if (x >= task.x2 - task.handleWidth * 2) {
    x = task.x2 - task.handleWidth * 2;
  }
  var steps = Math.round((x - task.x1) / xStep);
  var additionalXValue = steps * xStep;
  var newX = task.x1 + additionalXValue;
  return newX;
};
var endByX = function endByX(x, xStep, task) {
  if (x <= task.x1 + task.handleWidth * 2) {
    x = task.x1 + task.handleWidth * 2;
  }
  var steps = Math.round((x - task.x2) / xStep);
  var additionalXValue = steps * xStep;
  var newX = task.x2 + additionalXValue;
  return newX;
};
var moveByX = function moveByX(x, xStep, task) {
  var steps = Math.round((x - task.x1) / xStep);
  var additionalXValue = steps * xStep;
  var newX1 = task.x1 + additionalXValue;
  var newX2 = newX1 + task.x2 - task.x1;
  return [newX1, newX2];
};
var dateByX = function dateByX(x, taskX, taskDate, xStep, timeStep) {
  var newDate = new Date((x - taskX) / xStep * timeStep + taskDate.getTime());
  newDate = new Date(newDate.getTime() + (newDate.getTimezoneOffset() - taskDate.getTimezoneOffset()) * 60000);
  return newDate;
};
var handleTaskBySVGMouseEvent = function handleTaskBySVGMouseEvent(svgX, action, selectedTask, xStep, timeStep, initEventX1Delta, rtl) {
  var result;
  switch (selectedTask.type) {
    case "milestone":
      result = handleTaskBySVGMouseEventForMilestone(svgX, action, selectedTask, xStep, timeStep, initEventX1Delta);
      break;
    default:
      result = handleTaskBySVGMouseEventForBar(svgX, action, selectedTask, xStep, timeStep, initEventX1Delta, rtl);
      break;
  }
  return result;
};
var handleTaskBySVGMouseEventForBar = function handleTaskBySVGMouseEventForBar(svgX, action, selectedTask, xStep, timeStep, initEventX1Delta, rtl) {
  var changedTask = _extends({}, selectedTask);
  var isChanged = false;
  switch (action) {
    case "progress":
      if (rtl) {
        changedTask.progress = progressByXRTL(svgX, selectedTask);
      } else {
        changedTask.progress = progressByX(svgX, selectedTask);
      }
      isChanged = changedTask.progress !== selectedTask.progress;
      if (isChanged) {
        var _progressWithByParams2 = progressWithByParams(changedTask.x1, changedTask.x2, changedTask.progress, rtl),
          progressWidth = _progressWithByParams2[0],
          progressX = _progressWithByParams2[1];
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    case "start":
      {
        var newX1 = startByX(svgX, xStep, selectedTask);
        changedTask.x1 = newX1;
        isChanged = changedTask.x1 !== selectedTask.x1;
        if (isChanged) {
          if (rtl) {
            changedTask.end = dateByX(newX1, selectedTask.x1, selectedTask.end, xStep, timeStep);
          } else {
            changedTask.start = dateByX(newX1, selectedTask.x1, selectedTask.start, xStep, timeStep);
          }
          var _progressWithByParams3 = progressWithByParams(changedTask.x1, changedTask.x2, changedTask.progress, rtl),
            _progressWidth = _progressWithByParams3[0],
            _progressX = _progressWithByParams3[1];
          changedTask.progressWidth = _progressWidth;
          changedTask.progressX = _progressX;
        }
        break;
      }
    case "end":
      {
        var newX2 = endByX(svgX, xStep, selectedTask);
        changedTask.x2 = newX2;
        isChanged = changedTask.x2 !== selectedTask.x2;
        if (isChanged) {
          if (rtl) {
            changedTask.start = dateByX(newX2, selectedTask.x2, selectedTask.start, xStep, timeStep);
          } else {
            changedTask.end = dateByX(newX2, selectedTask.x2, selectedTask.end, xStep, timeStep);
          }
          var _progressWithByParams4 = progressWithByParams(changedTask.x1, changedTask.x2, changedTask.progress, rtl),
            _progressWidth2 = _progressWithByParams4[0],
            _progressX2 = _progressWithByParams4[1];
          changedTask.progressWidth = _progressWidth2;
          changedTask.progressX = _progressX2;
        }
        break;
      }
    case "move":
      {
        var _moveByX = moveByX(svgX - initEventX1Delta, xStep, selectedTask),
          newMoveX1 = _moveByX[0],
          newMoveX2 = _moveByX[1];
        isChanged = newMoveX1 !== selectedTask.x1;
        if (isChanged) {
          changedTask.start = dateByX(newMoveX1, selectedTask.x1, selectedTask.start, xStep, timeStep);
          changedTask.end = dateByX(newMoveX2, selectedTask.x2, selectedTask.end, xStep, timeStep);
          changedTask.x1 = newMoveX1;
          changedTask.x2 = newMoveX2;
          var _progressWithByParams5 = progressWithByParams(changedTask.x1, changedTask.x2, changedTask.progress, rtl),
            _progressWidth3 = _progressWithByParams5[0],
            _progressX3 = _progressWithByParams5[1];
          changedTask.progressWidth = _progressWidth3;
          changedTask.progressX = _progressX3;
        }
        break;
      }
  }
  return {
    isChanged: isChanged,
    changedTask: changedTask
  };
};
var handleTaskBySVGMouseEventForMilestone = function handleTaskBySVGMouseEventForMilestone(svgX, action, selectedTask, xStep, timeStep, initEventX1Delta) {
  var changedTask = _extends({}, selectedTask);
  var isChanged = false;
  switch (action) {
    case "move":
      {
        var _moveByX2 = moveByX(svgX - initEventX1Delta, xStep, selectedTask),
          newMoveX1 = _moveByX2[0],
          newMoveX2 = _moveByX2[1];
        isChanged = newMoveX1 !== selectedTask.x1;
        if (isChanged) {
          changedTask.start = dateByX(newMoveX1, selectedTask.x1, selectedTask.start, xStep, timeStep);
          changedTask.end = changedTask.start;
          changedTask.x1 = newMoveX1;
          changedTask.x2 = newMoveX2;
        }
        break;
      }
  }
  return {
    isChanged: isChanged,
    changedTask: changedTask
  };
};

function isKeyboardEvent(event) {
  return event.key !== undefined;
}
function removeHiddenTasks(tasks) {
  var groupedTasks = tasks.filter(function (t) {
    return t.hideChildren && t.type === "project";
  });
  if (groupedTasks.length > 0) {
    var _loop = function _loop() {
      var groupedTask = groupedTasks[i];
      var children = getChildren(tasks, groupedTask);
      tasks = tasks.filter(function (t) {
        return children.indexOf(t) === -1;
      });
    };
    for (var i = 0; groupedTasks.length > i; i++) {
      _loop();
    }
  }
  return tasks;
}
function getChildren(taskList, task) {
  var tasks = [];
  if (task.type !== "project") {
    tasks = taskList.filter(function (t) {
      return t.dependencies && t.dependencies.indexOf(task.id) !== -1;
    });
  } else {
    tasks = taskList.filter(function (t) {
      return t.project && t.project === task.id;
    });
  }
  var taskChildren = [];
  tasks.forEach(function (t) {
    taskChildren.push.apply(taskChildren, getChildren(taskList, t));
  });
  tasks = tasks.concat(tasks, taskChildren);
  return tasks;
}
var sortTasks = function sortTasks(taskA, taskB) {
  var orderA = taskA.displayOrder || Number.MAX_VALUE;
  var orderB = taskB.displayOrder || Number.MAX_VALUE;
  if (orderA > orderB) {
    return 1;
  } else if (orderA < orderB) {
    return -1;
  } else {
    return 0;
  }
};

var styles$6 = {"barWrapper":"_KxSXS","barHandle":"_3w_5u","barBackground":"_31ERP"};

var BarDisplay = function BarDisplay(_ref) {
  var x = _ref.x,
    y = _ref.y,
    width = _ref.width,
    height = _ref.height,
    isSelected = _ref.isSelected,
    progressX = _ref.progressX,
    progressWidth = _ref.progressWidth,
    barCornerRadius = _ref.barCornerRadius,
    styles = _ref.styles,
    onMouseDown = _ref.onMouseDown;
  var getProcessColor = function getProcessColor() {
    return isSelected ? styles.progressSelectedColor : styles.progressColor;
  };
  var getBarColor = function getBarColor() {
    return isSelected ? styles.backgroundSelectedColor : styles.backgroundColor;
  };
  return React__default.createElement("g", {
    onMouseDown: onMouseDown
  }, React__default.createElement("rect", {
    x: x,
    width: width,
    y: y,
    height: height,
    ry: barCornerRadius,
    rx: barCornerRadius,
    fill: getBarColor(),
    className: styles$6.barBackground
  }), React__default.createElement("rect", {
    x: progressX,
    width: progressWidth,
    y: y,
    height: height,
    ry: barCornerRadius,
    rx: barCornerRadius,
    fill: getProcessColor()
  }));
};

var BarDateHandle = function BarDateHandle(_ref) {
  var x = _ref.x,
    y = _ref.y,
    width = _ref.width,
    height = _ref.height,
    barCornerRadius = _ref.barCornerRadius,
    onMouseDown = _ref.onMouseDown;
  return React__default.createElement("rect", {
    x: x,
    y: y,
    width: width,
    height: height,
    className: styles$6.barHandle,
    ry: barCornerRadius,
    rx: barCornerRadius,
    onMouseDown: onMouseDown
  });
};

var BarProgressHandle = function BarProgressHandle(_ref) {
  var progressPoint = _ref.progressPoint,
    onMouseDown = _ref.onMouseDown;
  return React__default.createElement("polygon", {
    className: styles$6.barHandle,
    points: progressPoint,
    onMouseDown: onMouseDown
  });
};

var Bar = function Bar(_ref) {
  var task = _ref.task,
    isProgressChangeable = _ref.isProgressChangeable,
    isDateChangeable = _ref.isDateChangeable,
    rtl = _ref.rtl,
    onEventStart = _ref.onEventStart,
    isSelected = _ref.isSelected;
  var progressPoint = getProgressPoint(+!rtl * task.progressWidth + task.progressX, task.y, task.height);
  var handleHeight = task.height - 2;
  return React__default.createElement("g", {
    className: styles$6.barWrapper,
    tabIndex: 0
  }, React__default.createElement(BarDisplay, {
    x: task.x1,
    y: task.y,
    width: task.x2 - task.x1,
    height: task.height,
    progressX: task.progressX,
    progressWidth: task.progressWidth,
    barCornerRadius: task.barCornerRadius,
    styles: task.styles,
    isSelected: isSelected,
    onMouseDown: function onMouseDown(e) {
      isDateChangeable && onEventStart("move", task, e);
    }
  }), React__default.createElement("g", {
    className: "handleGroup"
  }, isDateChangeable && React__default.createElement("g", null, React__default.createElement(BarDateHandle, {
    x: task.x1 + 1,
    y: task.y + 1,
    width: task.handleWidth,
    height: handleHeight,
    barCornerRadius: task.barCornerRadius,
    onMouseDown: function onMouseDown(e) {
      onEventStart("start", task, e);
    }
  }), React__default.createElement(BarDateHandle, {
    x: task.x2 - task.handleWidth - 1,
    y: task.y + 1,
    width: task.handleWidth,
    height: handleHeight,
    barCornerRadius: task.barCornerRadius,
    onMouseDown: function onMouseDown(e) {
      onEventStart("end", task, e);
    }
  })), isProgressChangeable && React__default.createElement(BarProgressHandle, {
    progressPoint: progressPoint,
    onMouseDown: function onMouseDown(e) {
      onEventStart("progress", task, e);
    }
  })));
};

var BarSmall = function BarSmall(_ref) {
  var task = _ref.task,
    isProgressChangeable = _ref.isProgressChangeable,
    isDateChangeable = _ref.isDateChangeable,
    onEventStart = _ref.onEventStart,
    isSelected = _ref.isSelected;
  var progressPoint = getProgressPoint(task.progressWidth + task.x1, task.y, task.height);
  return React__default.createElement("g", {
    className: styles$6.barWrapper,
    tabIndex: 0
  }, React__default.createElement(BarDisplay, {
    x: task.x1,
    y: task.y,
    width: task.x2 - task.x1,
    height: task.height,
    progressX: task.progressX,
    progressWidth: task.progressWidth,
    barCornerRadius: task.barCornerRadius,
    styles: task.styles,
    isSelected: isSelected,
    onMouseDown: function onMouseDown(e) {
      isDateChangeable && onEventStart("move", task, e);
    }
  }), React__default.createElement("g", {
    className: "handleGroup"
  }, isProgressChangeable && React__default.createElement(BarProgressHandle, {
    progressPoint: progressPoint,
    onMouseDown: function onMouseDown(e) {
      onEventStart("progress", task, e);
    }
  })));
};

var styles$7 = {"milestoneWrapper":"_RRr13","milestoneBackground":"_2P2B1"};

var Milestone = function Milestone(_ref) {
  var task = _ref.task,
    isDateChangeable = _ref.isDateChangeable,
    onEventStart = _ref.onEventStart,
    isSelected = _ref.isSelected;
  var transform = "rotate(45 " + (task.x1 + task.height * 0.356) + " \n    " + (task.y + task.height * 0.85) + ")";
  var getBarColor = function getBarColor() {
    return isSelected ? task.styles.backgroundSelectedColor : task.styles.backgroundColor;
  };
  return React__default.createElement("g", {
    tabIndex: 0,
    className: styles$7.milestoneWrapper
  }, React__default.createElement("rect", {
    fill: getBarColor(),
    x: task.x1,
    width: task.height,
    y: task.y,
    height: task.height,
    rx: task.barCornerRadius,
    ry: task.barCornerRadius,
    transform: transform,
    className: styles$7.milestoneBackground,
    onMouseDown: function onMouseDown(e) {
      isDateChangeable && onEventStart("move", task, e);
    }
  }));
};

var styles$8 = {"projectWrapper":"_1KJ6x","projectBackground":"_2RbVy","projectTop":"_2pZMF"};

var Project = function Project(_ref) {
  var task = _ref.task,
    isSelected = _ref.isSelected;
  var barColor = isSelected ? task.styles.backgroundSelectedColor : task.styles.backgroundColor;
  var processColor = isSelected ? task.styles.progressSelectedColor : task.styles.progressColor;
  var projectWith = task.x2 - task.x1;
  var projectLeftTriangle = [task.x1, task.y + task.height / 2 - 1, task.x1, task.y + task.height, task.x1 + 15, task.y + task.height / 2 - 1].join(",");
  var projectRightTriangle = [task.x2, task.y + task.height / 2 - 1, task.x2, task.y + task.height, task.x2 - 15, task.y + task.height / 2 - 1].join(",");
  return React__default.createElement("g", {
    tabIndex: 0,
    className: styles$8.projectWrapper
  }, React__default.createElement("rect", {
    fill: barColor,
    x: task.x1,
    width: projectWith,
    y: task.y,
    height: task.height,
    rx: task.barCornerRadius,
    ry: task.barCornerRadius,
    className: styles$8.projectBackground
  }), React__default.createElement("rect", {
    x: task.progressX,
    width: task.progressWidth,
    y: task.y,
    height: task.height,
    ry: task.barCornerRadius,
    rx: task.barCornerRadius,
    fill: processColor
  }), React__default.createElement("rect", {
    fill: barColor,
    x: task.x1,
    width: projectWith,
    y: task.y,
    height: task.height / 2,
    rx: task.barCornerRadius,
    ry: task.barCornerRadius,
    className: styles$8.projectTop
  }), React__default.createElement("polygon", {
    className: styles$8.projectTop,
    points: projectLeftTriangle,
    fill: barColor
  }), React__default.createElement("polygon", {
    className: styles$8.projectTop,
    points: projectRightTriangle,
    fill: barColor
  }));
};

var style = {"barLabel":"_3zRJQ","barLabelOutside":"_3KcaM","statusDot":"_3ITgM"};

var TaskItem = function TaskItem(props) {
  var _props = _extends({}, props),
    task = _props.task,
    arrowIndent = _props.arrowIndent,
    isDelete = _props.isDelete,
    taskHeight = _props.taskHeight,
    isSelected = _props.isSelected,
    rtl = _props.rtl,
    onEventStart = _props.onEventStart,
    isProgressChangeable = _props.isProgressChangeable,
    isDateChangeable = _props.isDateChangeable;
  var textRef = React.useRef(null);
  var _useState = React.useState(React__default.createElement("div", null)),
    taskItem = _useState[0],
    setTaskItem = _useState[1];
  var _useState2 = React.useState(true),
    isTextInside = _useState2[0],
    setIsTextInside = _useState2[1];
  var normalizedStatus = normalizeStatus(task.status);
  var statusColor = getStatusColor(normalizedStatus);
  var statusBadgeText = getStatusBadgeText(normalizedStatus);
  var taskItemProps = React.useMemo(function () {
    return {
      task: task,
      arrowIndent: arrowIndent,
      taskHeight: taskHeight,
      isProgressChangeable: isProgressChangeable,
      isDateChangeable: isDateChangeable,
      isDelete: isDelete,
      isSelected: isSelected,
      rtl: rtl,
      onEventStart: onEventStart
    };
  }, [task, arrowIndent, taskHeight, isProgressChangeable, isDateChangeable, isDelete, isSelected, rtl, onEventStart]);
  React.useEffect(function () {
    switch (task.typeInternal) {
      case "milestone":
        setTaskItem(React__default.createElement(Milestone, Object.assign({}, taskItemProps)));
        break;
      case "project":
        setTaskItem(React__default.createElement(Project, Object.assign({}, taskItemProps)));
        break;
      case "smalltask":
        setTaskItem(React__default.createElement(BarSmall, Object.assign({}, taskItemProps)));
        break;
      default:
        setTaskItem(React__default.createElement(Bar, Object.assign({}, taskItemProps)));
        break;
    }
  }, [task, taskItemProps]);
  var getBBoxWidth = function getBBoxWidth() {
    if (!textRef.current || typeof textRef.current.getBBox !== "function") {
      return 0;
    }
    return textRef.current.getBBox().width;
  };
  React.useEffect(function () {
    setIsTextInside(getBBoxWidth() < task.x2 - task.x1);
  }, [textRef, task]);
  var getX = function getX() {
    var width = task.x2 - task.x1;
    var hasChild = task.barChildren.length > 0;
    if (isTextInside) {
      return task.x1 + width * 0.5;
    }
    if (rtl && textRef.current) {
      return task.x1 - getBBoxWidth() - arrowIndent * +hasChild - arrowIndent * 0.2;
    } else {
      return task.x1 + width + arrowIndent * +hasChild + arrowIndent * 0.2;
    }
  };
  return React__default.createElement("g", {
    onKeyDown: function onKeyDown(e) {
      switch (e.key) {
        case "Delete":
          {
            if (isDelete) onEventStart("delete", task, e);
            break;
          }
      }
      e.stopPropagation();
    },
    onMouseEnter: function onMouseEnter(e) {
      onEventStart("mouseenter", task, e);
    },
    onMouseLeave: function onMouseLeave(e) {
      onEventStart("mouseleave", task, e);
    },
    onDoubleClick: function onDoubleClick(e) {
      onEventStart("dblclick", task, e);
    },
    onClick: function onClick(e) {
      onEventStart("click", task, e);
    },
    onFocus: function onFocus() {
      onEventStart("select", task);
    }
  }, taskItem, React__default.createElement("text", {
    x: getX(),
    y: task.y + taskHeight * 0.5,
    className: isTextInside ? style.barLabel :  style.barLabelOutside,
    ref: textRef
  }, !!statusBadgeText && React__default.createElement("tspan", {
    className: style.statusDot,
    fill: statusColor
  }, "\u25CF"), React__default.createElement("tspan", {
    dx: statusBadgeText ? 4 : 0
  }, task.name)));
};

var TaskGanttContent = function TaskGanttContent(_ref) {
  var tasks = _ref.tasks,
    dates = _ref.dates,
    ganttEvent = _ref.ganttEvent,
    selectedTask = _ref.selectedTask,
    rowHeight = _ref.rowHeight,
    columnWidth = _ref.columnWidth,
    timeStep = _ref.timeStep,
    svg = _ref.svg,
    taskHeight = _ref.taskHeight,
    arrowColor = _ref.arrowColor,
    arrowIndent = _ref.arrowIndent,
    fontFamily = _ref.fontFamily,
    fontSize = _ref.fontSize,
    rtl = _ref.rtl,
    setGanttEvent = _ref.setGanttEvent,
    setFailedTask = _ref.setFailedTask,
    setSelectedTask = _ref.setSelectedTask,
    onDateChange = _ref.onDateChange,
    onProgressChange = _ref.onProgressChange,
    onDoubleClick = _ref.onDoubleClick,
    onClick = _ref.onClick,
    onDelete = _ref.onDelete;
  var point = svg !== null && svg !== void 0 && svg.current && "createSVGPoint" in svg.current ? svg.current.createSVGPoint() : undefined;
  var _useState = React.useState(0),
    xStep = _useState[0],
    setXStep = _useState[1];
  var _useState2 = React.useState(0),
    initEventX1Delta = _useState2[0],
    setInitEventX1Delta = _useState2[1];
  var _useState3 = React.useState(false),
    isMoving = _useState3[0],
    setIsMoving = _useState3[1];
  React.useEffect(function () {
    var dateDelta = dates[1].getTime() - dates[0].getTime() - dates[1].getTimezoneOffset() * 60 * 1000 + dates[0].getTimezoneOffset() * 60 * 1000;
    var newXStep = timeStep * columnWidth / dateDelta;
    setXStep(newXStep);
  }, [columnWidth, dates, timeStep]);
  React.useEffect(function () {
    var handleMouseMove = function handleMouseMove(event) {
      try {
        var _svg$current$getScree;
        if (!ganttEvent.changedTask || !point || !(svg !== null && svg !== void 0 && svg.current)) return Promise.resolve();
        event.preventDefault();
        point.x = event.clientX;
        var cursor = point.matrixTransform(svg === null || svg === void 0 ? void 0 : (_svg$current$getScree = svg.current.getScreenCTM()) === null || _svg$current$getScree === void 0 ? void 0 : _svg$current$getScree.inverse());
        var _handleTaskBySVGMouse = handleTaskBySVGMouseEvent(cursor.x, ganttEvent.action, ganttEvent.changedTask, xStep, timeStep, initEventX1Delta, rtl),
          isChanged = _handleTaskBySVGMouse.isChanged,
          changedTask = _handleTaskBySVGMouse.changedTask;
        if (isChanged) {
          setGanttEvent({
            action: ganttEvent.action,
            changedTask: changedTask
          });
        }
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    };
    var _handleMouseUp = function handleMouseUp(event) {
      try {
        var _svg$current$getScree2;
        var _temp5 = function _temp5() {
          if (!operationSuccess) {
            setFailedTask(originalSelectedTask);
          }
        };
        var action = ganttEvent.action,
          originalSelectedTask = ganttEvent.originalSelectedTask,
          changedTask = ganttEvent.changedTask;
        if (!changedTask || !point || !(svg !== null && svg !== void 0 && svg.current) || !originalSelectedTask) return Promise.resolve();
        event.preventDefault();
        point.x = event.clientX;
        var cursor = point.matrixTransform(svg === null || svg === void 0 ? void 0 : (_svg$current$getScree2 = svg.current.getScreenCTM()) === null || _svg$current$getScree2 === void 0 ? void 0 : _svg$current$getScree2.inverse());
        var _handleTaskBySVGMouse2 = handleTaskBySVGMouseEvent(cursor.x, action, changedTask, xStep, timeStep, initEventX1Delta, rtl),
          newChangedTask = _handleTaskBySVGMouse2.changedTask;
        var isNotLikeOriginal = originalSelectedTask.start !== newChangedTask.start || originalSelectedTask.end !== newChangedTask.end || originalSelectedTask.progress !== newChangedTask.progress;
        svg.current.removeEventListener("mousemove", handleMouseMove);
        svg.current.removeEventListener("mouseup", _handleMouseUp);
        setGanttEvent({
          action: ""
        });
        setIsMoving(false);
        var operationSuccess = true;
        var _temp4 = function () {
          if ((action === "move" || action === "end" || action === "start") && onDateChange && isNotLikeOriginal) {
            var _temp = _catch(function () {
              return Promise.resolve(onDateChange(newChangedTask, newChangedTask.barChildren)).then(function (result) {
                if (result !== undefined) {
                  operationSuccess = result;
                }
              });
            }, function () {
              operationSuccess = false;
            });
            if (_temp && _temp.then) return _temp.then(function () {});
          } else {
            var _temp6 = function () {
              if (onProgressChange && isNotLikeOriginal) {
                var _temp2 = _catch(function () {
                  return Promise.resolve(onProgressChange(newChangedTask, newChangedTask.barChildren)).then(function (result) {
                    if (result !== undefined) {
                      operationSuccess = result;
                    }
                  });
                }, function () {
                  operationSuccess = false;
                });
                if (_temp2 && _temp2.then) return _temp2.then(function () {});
              }
            }();
            if (_temp6 && _temp6.then) return _temp6.then(function () {});
          }
        }();
        return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(_temp5) : _temp5(_temp4));
      } catch (e) {
        return Promise.reject(e);
      }
    };
    if (!isMoving && (ganttEvent.action === "move" || ganttEvent.action === "end" || ganttEvent.action === "start" || ganttEvent.action === "progress") && svg !== null && svg !== void 0 && svg.current) {
      svg.current.addEventListener("mousemove", handleMouseMove);
      svg.current.addEventListener("mouseup", _handleMouseUp);
      setIsMoving(true);
    }
  }, [ganttEvent, xStep, initEventX1Delta, onProgressChange, timeStep, onDateChange, svg, isMoving, point, rtl, setFailedTask, setGanttEvent]);
  var handleBarEventStart = function handleBarEventStart(action, task, event) {
    try {
      return Promise.resolve(function () {
        if (!event) {
          if (action === "select") {
            setSelectedTask(task.id);
          }
        } else return function () {
          if (isKeyboardEvent(event)) {
            var _temp9 = function () {
              if (action === "delete") {
                var _temp8 = function () {
                  if (onDelete) {
                    var _temp7 = _catch(function () {
                      return Promise.resolve(onDelete(task)).then(function (result) {
                        if (result !== undefined && result) {
                          setGanttEvent({
                            action: action,
                            changedTask: task
                          });
                        }
                      });
                    }, function (error) {
                      console.error("Error on Delete. " + error);
                    });
                    if (_temp7 && _temp7.then) return _temp7.then(function () {});
                  }
                }();
                if (_temp8 && _temp8.then) return _temp8.then(function () {});
              }
            }();
            if (_temp9 && _temp9.then) return _temp9.then(function () {});
          } else if (action === "mouseenter") {
            if (!ganttEvent.action) {
              setGanttEvent({
                action: action,
                changedTask: task,
                originalSelectedTask: task
              });
            }
          } else if (action === "mouseleave") {
            if (ganttEvent.action === "mouseenter") {
              setGanttEvent({
                action: ""
              });
            }
          } else if (action === "dblclick") {
            !!onDoubleClick && onDoubleClick(task);
          } else if (action === "click") {
            !!onClick && onClick(task);
          } else if (action === "move") {
            var _svg$current$getScree3;
            if (!(svg !== null && svg !== void 0 && svg.current) || !point) return;
            point.x = event.clientX;
            var cursor = point.matrixTransform((_svg$current$getScree3 = svg.current.getScreenCTM()) === null || _svg$current$getScree3 === void 0 ? void 0 : _svg$current$getScree3.inverse());
            setInitEventX1Delta(cursor.x - task.x1);
            setGanttEvent({
              action: action,
              changedTask: task,
              originalSelectedTask: task
            });
          } else {
            setGanttEvent({
              action: action,
              changedTask: task,
              originalSelectedTask: task
            });
          }
        }();
      }());
    } catch (e) {
      return Promise.reject(e);
    }
  };
  return React__default.createElement("g", {
    className: "content"
  }, React__default.createElement("g", {
    className: "arrows",
    fill: arrowColor,
    stroke: arrowColor
  }, tasks.map(function (task) {
    return task.barChildren.map(function (child) {
      return React__default.createElement(Arrow, {
        key: "Arrow from " + task.id + " to " + tasks[child.index].id,
        taskFrom: task,
        taskTo: tasks[child.index],
        rowHeight: rowHeight,
        taskHeight: taskHeight,
        arrowIndent: arrowIndent,
        rtl: rtl
      });
    });
  })), React__default.createElement("g", {
    className: "bar",
    fontFamily: fontFamily,
    fontSize: fontSize
  }, tasks.map(function (task) {
    return React__default.createElement(TaskItem, {
      task: task,
      arrowIndent: arrowIndent,
      taskHeight: taskHeight,
      isProgressChangeable: !!onProgressChange && !task.isDisabled,
      isDateChangeable: !!onDateChange && !task.isDisabled,
      isDelete: !task.isDisabled,
      onEventStart: handleBarEventStart,
      key: task.id,
      isSelected: !!selectedTask && task.id === selectedTask.id,
      rtl: rtl
    });
  })));
};

var styles$9 = {"ganttVerticalContainer":"_CZjuD","horizontalContainer":"_2B2zv","wrapper":"_3eULf","taskListPanel":"_3eX5j","splitHandle":"_1YST3","splitHandleActive":"_3cO1L","ganttPanel":"_1G4xA","scrollRow":"_2VUKJ","scrollCellLeft":"_1vvPx","scrollCellRight":"_3sIUT","scrollSplitter":"_3gMam"};

var TaskGantt = function TaskGantt(_ref) {
  var gridProps = _ref.gridProps,
    calendarProps = _ref.calendarProps,
    barProps = _ref.barProps,
    ganttHeight = _ref.ganttHeight,
    scrollY = _ref.scrollY,
    scrollX = _ref.scrollX,
    verticalGanttContainerRef = _ref.verticalGanttContainerRef;
  var ganttSVGRef = React.useRef(null);
  var horizontalContainerRef = React.useRef(null);
  var internalVerticalRef = React.useRef(null);
  var ganttContainerRef = verticalGanttContainerRef || internalVerticalRef;
  var newBarProps = _extends({}, barProps, {
    svg: ganttSVGRef
  });
  React.useEffect(function () {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);
  React.useEffect(function () {
    if (ganttContainerRef.current) {
      ganttContainerRef.current.scrollLeft = scrollX;
    }
  }, [scrollX, ganttContainerRef]);
  return React__default.createElement("div", {
    className: styles$9.ganttVerticalContainer,
    ref: ganttContainerRef,
    dir: "ltr"
  }, React__default.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: gridProps.svgWidth,
    height: calendarProps.headerHeight,
    fontFamily: barProps.fontFamily
  }, React__default.createElement(Calendar, Object.assign({}, calendarProps))), React__default.createElement("div", {
    ref: horizontalContainerRef,
    className: styles$9.horizontalContainer,
    style: ganttHeight ? {
      height: ganttHeight,
      width: gridProps.svgWidth
    } : {
      width: gridProps.svgWidth
    }
  }, React__default.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: gridProps.svgWidth,
    height: barProps.rowHeight * barProps.tasks.length,
    fontFamily: barProps.fontFamily,
    ref: ganttSVGRef
  }, React__default.createElement(Grid, Object.assign({}, gridProps)), React__default.createElement(TaskGanttContent, Object.assign({}, newBarProps)))));
};

var styles$a = {"scrollWrapper":"_2k9Ys","scroll":"_19jgW"};

var HorizontalScroll = function HorizontalScroll(_ref) {
  var scroll = _ref.scroll,
    svgWidth = _ref.svgWidth,
    scrollerWidth = _ref.scrollerWidth,
    rtl = _ref.rtl,
    onScroll = _ref.onScroll,
    dataTestId = _ref["data-testid"],
    containerRef = _ref.containerRef,
    hidden = _ref.hidden;
  var scrollRef = React.useRef(null);
  var wrapperRef = containerRef != null ? containerRef : scrollRef;
  React.useEffect(function () {
    if (wrapperRef.current) {
      wrapperRef.current.scrollLeft = scroll;
    }
  }, [scroll, wrapperRef]);
  return React__default.createElement("div", {
    dir: rtl ? "rtl" : "ltr",
    className: styles$a.scrollWrapper,
    onScroll: onScroll,
    ref: wrapperRef,
    "data-testid": dataTestId,
    style: hidden ? {
      display: "none"
    } : {
      width: svgWidth
    }
  }, React__default.createElement("div", {
    style: {
      width: scrollerWidth != null ? scrollerWidth : svgWidth
    },
    className: styles$a.scroll
  }));
};

var DEFAULT_TASK_LIST_WIDTH = 450;
var MIN_PANE_WIDTH = 150;
var SPLIT_HANDLE_WIDTH = 8;
var clampTaskListWidth = function clampTaskListWidth(width, containerWidth) {
  var maxWidth = Math.max(MIN_PANE_WIDTH, containerWidth - MIN_PANE_WIDTH - SPLIT_HANDLE_WIDTH);
  return Math.min(Math.max(width, MIN_PANE_WIDTH), maxWidth);
};
var Gantt = function Gantt(_ref) {
  var tasks = _ref.tasks,
    _ref$headerHeight = _ref.headerHeight,
    headerHeight = _ref$headerHeight === void 0 ? 50 : _ref$headerHeight,
    _ref$columnWidth = _ref.columnWidth,
    columnWidth = _ref$columnWidth === void 0 ? 60 : _ref$columnWidth,
    _ref$listCellWidth = _ref.listCellWidth,
    listCellWidth = _ref$listCellWidth === void 0 ? "155px" : _ref$listCellWidth,
    _ref$rowHeight = _ref.rowHeight,
    rowHeight = _ref$rowHeight === void 0 ? 50 : _ref$rowHeight,
    _ref$ganttHeight = _ref.ganttHeight,
    ganttHeight = _ref$ganttHeight === void 0 ? 0 : _ref$ganttHeight,
    _ref$viewMode = _ref.viewMode,
    viewMode = _ref$viewMode === void 0 ? exports.ViewMode.Day : _ref$viewMode,
    _ref$preStepsCount = _ref.preStepsCount,
    preStepsCount = _ref$preStepsCount === void 0 ? 1 : _ref$preStepsCount,
    _ref$locale = _ref.locale,
    locale = _ref$locale === void 0 ? "en-GB" : _ref$locale,
    _ref$barFill = _ref.barFill,
    barFill = _ref$barFill === void 0 ? 60 : _ref$barFill,
    _ref$barCornerRadius = _ref.barCornerRadius,
    barCornerRadius = _ref$barCornerRadius === void 0 ? 3 : _ref$barCornerRadius,
    _ref$barProgressColor = _ref.barProgressColor,
    barProgressColor = _ref$barProgressColor === void 0 ? "#a3a3ff" : _ref$barProgressColor,
    _ref$barProgressSelec = _ref.barProgressSelectedColor,
    barProgressSelectedColor = _ref$barProgressSelec === void 0 ? "#8282f5" : _ref$barProgressSelec,
    _ref$barBackgroundCol = _ref.barBackgroundColor,
    barBackgroundColor = _ref$barBackgroundCol === void 0 ? "#b8c2cc" : _ref$barBackgroundCol,
    _ref$barBackgroundSel = _ref.barBackgroundSelectedColor,
    barBackgroundSelectedColor = _ref$barBackgroundSel === void 0 ? "#aeb8c2" : _ref$barBackgroundSel,
    _ref$projectProgressC = _ref.projectProgressColor,
    projectProgressColor = _ref$projectProgressC === void 0 ? "#7db59a" : _ref$projectProgressC,
    _ref$projectProgressS = _ref.projectProgressSelectedColor,
    projectProgressSelectedColor = _ref$projectProgressS === void 0 ? "#59a985" : _ref$projectProgressS,
    _ref$projectBackgroun = _ref.projectBackgroundColor,
    projectBackgroundColor = _ref$projectBackgroun === void 0 ? "#fac465" : _ref$projectBackgroun,
    _ref$projectBackgroun2 = _ref.projectBackgroundSelectedColor,
    projectBackgroundSelectedColor = _ref$projectBackgroun2 === void 0 ? "#f7bb53" : _ref$projectBackgroun2,
    _ref$milestoneBackgro = _ref.milestoneBackgroundColor,
    milestoneBackgroundColor = _ref$milestoneBackgro === void 0 ? "#f1c453" : _ref$milestoneBackgro,
    _ref$milestoneBackgro2 = _ref.milestoneBackgroundSelectedColor,
    milestoneBackgroundSelectedColor = _ref$milestoneBackgro2 === void 0 ? "#f29e4c" : _ref$milestoneBackgro2,
    _ref$rtl = _ref.rtl,
    rtl = _ref$rtl === void 0 ? false : _ref$rtl,
    _ref$handleWidth = _ref.handleWidth,
    handleWidth = _ref$handleWidth === void 0 ? 8 : _ref$handleWidth,
    _ref$timeStep = _ref.timeStep,
    timeStep = _ref$timeStep === void 0 ? 300000 : _ref$timeStep,
    _ref$arrowColor = _ref.arrowColor,
    arrowColor = _ref$arrowColor === void 0 ? "grey" : _ref$arrowColor,
    _ref$fontFamily = _ref.fontFamily,
    fontFamily = _ref$fontFamily === void 0 ? "Arial, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue" : _ref$fontFamily,
    _ref$fontSize = _ref.fontSize,
    fontSize = _ref$fontSize === void 0 ? "14px" : _ref$fontSize,
    _ref$arrowIndent = _ref.arrowIndent,
    arrowIndent = _ref$arrowIndent === void 0 ? 20 : _ref$arrowIndent,
    _ref$todayColor = _ref.todayColor,
    todayColor = _ref$todayColor === void 0 ? "rgba(252, 248, 227, 0.5)" : _ref$todayColor,
    viewDate = _ref.viewDate,
    _ref$TooltipContent = _ref.TooltipContent,
    TooltipContent = _ref$TooltipContent === void 0 ? StandardTooltipContent : _ref$TooltipContent,
    _ref$TaskListHeader = _ref.TaskListHeader,
    TaskListHeader = _ref$TaskListHeader === void 0 ? TaskListHeaderDefault : _ref$TaskListHeader,
    _ref$TaskListTable = _ref.TaskListTable,
    TaskListTable = _ref$TaskListTable === void 0 ? TaskListTableDefault : _ref$TaskListTable,
    _ref$visibleFields = _ref.visibleFields,
    visibleFields = _ref$visibleFields === void 0 ? DEFAULT_VISIBLE_FIELDS : _ref$visibleFields,
    _ref$effortDisplayUni = _ref.effortDisplayUnit,
    effortDisplayUnit = _ref$effortDisplayUni === void 0 ? "MH" : _ref$effortDisplayUni,
    enableColumnDrag = _ref.enableColumnDrag,
    onDateChange = _ref.onDateChange,
    onProgressChange = _ref.onProgressChange,
    onDoubleClick = _ref.onDoubleClick,
    onClick = _ref.onClick,
    onDelete = _ref.onDelete,
    onSelect = _ref.onSelect,
    onExpanderClick = _ref.onExpanderClick,
    onTaskUpdate = _ref.onTaskUpdate,
    onCellCommit = _ref.onCellCommit;
  var wrapperRef = React.useRef(null);
  var taskListRef = React.useRef(null);
  var taskListHeaderRef = React.useRef(null);
  var taskListBodyRef = React.useRef(null);
  var ganttContainerRef = React.useRef(null);
  var splitStartXRef = React.useRef(null);
  var splitStartWidthRef = React.useRef(null);
  var splitMoveHandlerRef = React.useRef(null);
  var splitUpHandlerRef = React.useRef(null);
  var supportsPointerEvents = typeof window !== "undefined" && "PointerEvent" in window;
  var _useState = React.useState(function () {
      var _ganttDateRange = ganttDateRange(tasks, viewMode, preStepsCount),
        startDate = _ganttDateRange[0],
        endDate = _ganttDateRange[1];
      return {
        viewMode: viewMode,
        dates: seedDates(startDate, endDate, viewMode)
      };
    }),
    dateSetup = _useState[0],
    setDateSetup = _useState[1];
  var _useState2 = React.useState(undefined),
    currentViewDate = _useState2[0],
    setCurrentViewDate = _useState2[1];
  var _useState3 = React.useState(DEFAULT_TASK_LIST_WIDTH),
    taskListWidth = _useState3[0],
    setTaskListWidth = _useState3[1];
  var _useState4 = React.useState(0),
    wrapperWidth = _useState4[0],
    setWrapperWidth = _useState4[1];
  var _useState5 = React.useState(false),
    isResizing = _useState5[0],
    setIsResizing = _useState5[1];
  var _useState6 = React.useState(0),
    svgContainerWidth = _useState6[0],
    setSvgContainerWidth = _useState6[1];
  var _useState7 = React.useState(ganttHeight),
    svgContainerHeight = _useState7[0],
    setSvgContainerHeight = _useState7[1];
  var _useState8 = React.useState([]),
    barTasks = _useState8[0],
    setBarTasks = _useState8[1];
  var _useState9 = React.useState({
      action: ""
    }),
    ganttEvent = _useState9[0],
    setGanttEvent = _useState9[1];
  var taskHeight = React.useMemo(function () {
    return rowHeight * barFill / 100;
  }, [rowHeight, barFill]);
  var _useState0 = React.useState(),
    selectedTask = _useState0[0],
    setSelectedTask = _useState0[1];
  var _useState1 = React.useState(null),
    failedTask = _useState1[0],
    setFailedTask = _useState1[1];
  var svgWidth = dateSetup.dates.length * columnWidth;
  var ganttFullHeight = barTasks.length * rowHeight;
  var _useState10 = React.useState(0),
    scrollY = _useState10[0],
    setScrollY = _useState10[1];
  var _useState11 = React.useState(0),
    scrollXLeft = _useState11[0],
    setScrollXLeft = _useState11[1];
  var _useState12 = React.useState(-1),
    scrollXRight = _useState12[0],
    setScrollXRight = _useState12[1];
  var _useState13 = React.useState(1430),
    leftScrollerWidth = _useState13[0],
    setLeftScrollerWidth = _useState13[1];
  var ignoreScrollLeftRef = React.useRef(false);
  var ignoreScrollRightRef = React.useRef(false);
  React.useEffect(function () {
    var filteredTasks;
    if (onExpanderClick) {
      filteredTasks = removeHiddenTasks(tasks);
    } else {
      filteredTasks = tasks;
    }
    filteredTasks = filteredTasks.sort(sortTasks);
    var _ganttDateRange2 = ganttDateRange(filteredTasks, viewMode, preStepsCount),
      startDate = _ganttDateRange2[0],
      endDate = _ganttDateRange2[1];
    var newDates = seedDates(startDate, endDate, viewMode);
    if (rtl) {
      newDates = newDates.reverse();
      if (scrollXRight === -1) {
        setScrollXRight(newDates.length * columnWidth);
      }
    }
    setDateSetup({
      dates: newDates,
      viewMode: viewMode
    });
    setBarTasks(convertToBarTasks(filteredTasks, newDates, columnWidth, rowHeight, taskHeight, barCornerRadius, handleWidth, rtl, barProgressColor, barProgressSelectedColor, barBackgroundColor, barBackgroundSelectedColor, projectProgressColor, projectProgressSelectedColor, projectBackgroundColor, projectBackgroundSelectedColor, milestoneBackgroundColor, milestoneBackgroundSelectedColor));
  }, [tasks, viewMode, preStepsCount, rowHeight, barCornerRadius, columnWidth, taskHeight, handleWidth, barProgressColor, barProgressSelectedColor, barBackgroundColor, barBackgroundSelectedColor, projectProgressColor, projectProgressSelectedColor, projectBackgroundColor, projectBackgroundSelectedColor, milestoneBackgroundColor, milestoneBackgroundSelectedColor, rtl, scrollXRight, onExpanderClick]);
  React.useEffect(function () {
    if (viewMode === dateSetup.viewMode && (viewDate && !currentViewDate || viewDate && (currentViewDate === null || currentViewDate === void 0 ? void 0 : currentViewDate.valueOf()) !== viewDate.valueOf())) {
      var dates = dateSetup.dates;
      var index = dates.findIndex(function (d, i) {
        return viewDate.valueOf() >= d.valueOf() && i + 1 !== dates.length && viewDate.valueOf() < dates[i + 1].valueOf();
      });
      if (index === -1) {
        return;
      }
      setCurrentViewDate(viewDate);
      setScrollXRight(columnWidth * index);
    }
  }, [viewDate, columnWidth, dateSetup.dates, dateSetup.viewMode, viewMode, currentViewDate, setCurrentViewDate]);
  React.useEffect(function () {
    var changedTask = ganttEvent.changedTask,
      action = ganttEvent.action;
    if (changedTask) {
      if (action === "delete") {
        setGanttEvent({
          action: ""
        });
        setBarTasks(barTasks.filter(function (t) {
          return t.id !== changedTask.id;
        }));
      } else if (action === "move" || action === "end" || action === "start" || action === "progress") {
        var prevStateTask = barTasks.find(function (t) {
          return t.id === changedTask.id;
        });
        if (prevStateTask && (prevStateTask.start.getTime() !== changedTask.start.getTime() || prevStateTask.end.getTime() !== changedTask.end.getTime() || prevStateTask.progress !== changedTask.progress)) {
          var newTaskList = barTasks.map(function (t) {
            return t.id === changedTask.id ? changedTask : t;
          });
          setBarTasks(newTaskList);
        }
      }
    }
  }, [ganttEvent, barTasks]);
  React.useEffect(function () {
    if (failedTask) {
      setBarTasks(barTasks.map(function (t) {
        return t.id !== failedTask.id ? t : failedTask;
      }));
      setFailedTask(null);
    }
  }, [failedTask, barTasks]);
  React.useEffect(function () {
    var updateWrapperWidth = function updateWrapperWidth() {
      if (wrapperRef.current) {
        setWrapperWidth(wrapperRef.current.offsetWidth);
      }
    };
    updateWrapperWidth();
    window.addEventListener("resize", updateWrapperWidth);
    return function () {
      return window.removeEventListener("resize", updateWrapperWidth);
    };
  }, []);
  React.useEffect(function () {
    if (!listCellWidth) {
      setTaskListWidth(0);
      return;
    }
    if (wrapperWidth) {
      setTaskListWidth(function (prev) {
        return clampTaskListWidth(prev, wrapperWidth);
      });
    }
  }, [listCellWidth, wrapperWidth]);
  var taskListOffset = listCellWidth ? taskListWidth + SPLIT_HANDLE_WIDTH : 0;
  React.useEffect(function () {
    if (wrapperWidth) {
      setSvgContainerWidth(Math.max(wrapperWidth - taskListOffset, 0));
    }
  }, [wrapperWidth, taskListOffset]);
  React.useEffect(function () {
    if (ganttHeight) {
      setSvgContainerHeight(ganttHeight + headerHeight);
    } else {
      setSvgContainerHeight(tasks.length * rowHeight + headerHeight);
    }
  }, [ganttHeight, tasks, headerHeight, rowHeight]);
  React.useEffect(function () {
    return function () {
      if (splitMoveHandlerRef.current) {
        document.removeEventListener("mousemove", splitMoveHandlerRef.current);
        splitMoveHandlerRef.current = null;
      }
      if (splitUpHandlerRef.current) {
        document.removeEventListener("mouseup", splitUpHandlerRef.current);
        splitUpHandlerRef.current = null;
      }
    };
  }, []);
  React.useEffect(function () {
    var handleWheel = function handleWheel(event) {
      if (event.shiftKey || event.deltaX) {
        var scrollMove = event.deltaX ? event.deltaX : event.deltaY;
        var newScrollX = scrollXRight + scrollMove;
        if (newScrollX < 0) {
          newScrollX = 0;
        } else if (newScrollX > svgWidth) {
          newScrollX = svgWidth;
        }
        ignoreScrollRightRef.current = true;
        setScrollXRight(newScrollX);
        event.preventDefault();
      } else if (ganttHeight) {
        var newScrollY = scrollY + event.deltaY;
        if (newScrollY < 0) {
          newScrollY = 0;
        } else if (newScrollY > ganttFullHeight - ganttHeight) {
          newScrollY = ganttFullHeight - ganttHeight;
        }
        if (newScrollY !== scrollY) {
          setScrollY(newScrollY);
          event.preventDefault();
        }
      }
    };
    var wrapperEl = wrapperRef.current;
    wrapperEl === null || wrapperEl === void 0 ? void 0 : wrapperEl.addEventListener("wheel", handleWheel, {
      passive: false
    });
    return function () {
      wrapperEl === null || wrapperEl === void 0 ? void 0 : wrapperEl.removeEventListener("wheel", handleWheel);
    };
  }, [scrollY, scrollXRight, ganttHeight, svgWidth, rtl, ganttFullHeight]);
  React.useEffect(function () {
    var updateLeftScroller = function updateLeftScroller() {
      var el = taskListBodyRef.current;
      if (el) {
        setLeftScrollerWidth(el.scrollWidth || 0);
      }
    };
    updateLeftScroller();
    var RO = window.ResizeObserver;
    var ro = RO ? new RO(updateLeftScroller) : null;
    if (ro && taskListBodyRef.current) {
      ro.observe(taskListBodyRef.current);
    }
    window.addEventListener("resize", updateLeftScroller);
    return function () {
      if (ro) {
        ro.disconnect();
      }
      window.removeEventListener("resize", updateLeftScroller);
    };
  }, [tasks, fontFamily, fontSize, listCellWidth, taskListBodyRef, visibleFields]);
  var handleScrollY = function handleScrollY(event) {
    if (scrollY !== event.currentTarget.scrollTop && !ignoreScrollLeftRef.current) {
      setScrollY(event.currentTarget.scrollTop);
      ignoreScrollLeftRef.current = true;
    } else {
      ignoreScrollLeftRef.current = false;
    }
  };
  var handleScrollLeft = function handleScrollLeft(event) {
    if (scrollXLeft !== event.currentTarget.scrollLeft && !ignoreScrollLeftRef.current) {
      setScrollXLeft(event.currentTarget.scrollLeft);
      ignoreScrollLeftRef.current = true;
    } else {
      ignoreScrollLeftRef.current = false;
    }
  };
  var handleScrollRight = function handleScrollRight(event) {
    if (scrollXRight !== event.currentTarget.scrollLeft && !ignoreScrollRightRef.current) {
      setScrollXRight(event.currentTarget.scrollLeft);
      ignoreScrollRightRef.current = true;
    } else {
      ignoreScrollRightRef.current = false;
    }
    if (ganttContainerRef.current && ganttContainerRef.current.scrollLeft !== event.currentTarget.scrollLeft) {
      ganttContainerRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };
  var handleKeyDown = function handleKeyDown(event) {
    var target = event.target;
    if (target instanceof HTMLElement) {
      if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }
    }
    event.preventDefault();
    var newScrollY = scrollY;
    var newScrollX = scrollXRight;
    var isX = true;
    switch (event.key) {
      case "Down":
      case "ArrowDown":
        newScrollY += rowHeight;
        isX = false;
        break;
      case "Up":
      case "ArrowUp":
        newScrollY -= rowHeight;
        isX = false;
        break;
      case "Left":
      case "ArrowLeft":
        newScrollX -= columnWidth;
        break;
      case "Right":
      case "ArrowRight":
        newScrollX += columnWidth;
        break;
    }
    if (isX) {
      if (newScrollX < 0) {
        newScrollX = 0;
      } else if (newScrollX > svgWidth) {
        newScrollX = svgWidth;
      }
      ignoreScrollRightRef.current = true;
      setScrollXRight(newScrollX);
    } else {
      if (newScrollY < 0) {
        newScrollY = 0;
      } else if (newScrollY > ganttFullHeight - ganttHeight) {
        newScrollY = ganttFullHeight - ganttHeight;
      }
      setScrollY(newScrollY);
    }
  };
  var handleSelectedTask = function handleSelectedTask(taskId) {
    var newSelectedTask = barTasks.find(function (t) {
      return t.id === taskId;
    });
    var oldSelectedTask = barTasks.find(function (t) {
      return !!selectedTask && t.id === selectedTask.id;
    });
    if (onSelect) {
      if (oldSelectedTask) {
        onSelect(oldSelectedTask, false);
      }
      if (newSelectedTask) {
        onSelect(newSelectedTask, true);
      }
    }
    setSelectedTask(newSelectedTask);
  };
  var handleExpanderClick = function handleExpanderClick(task) {
    if (onExpanderClick && task.hideChildren !== undefined) {
      onExpanderClick(_extends({}, task, {
        hideChildren: !task.hideChildren
      }));
    }
  };
  var updateTaskListWidth = function updateTaskListWidth(clientX) {
    if (splitStartXRef.current == null || splitStartWidthRef.current == null) {
      return;
    }
    if (!wrapperRef.current) {
      return;
    }
    var delta = clientX - splitStartXRef.current;
    var nextWidth = clampTaskListWidth(splitStartWidthRef.current + delta, wrapperRef.current.offsetWidth);
    setTaskListWidth(nextWidth);
  };
  var handleSplitPointerDown = function handleSplitPointerDown(event) {
    event.preventDefault();
    splitStartXRef.current = event.clientX;
    splitStartWidthRef.current = taskListWidth;
    setIsResizing(true);
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };
  var handleSplitPointerMove = function handleSplitPointerMove(event) {
    updateTaskListWidth(event.clientX);
  };
  var handleSplitPointerUp = function handleSplitPointerUp(event) {
    splitStartXRef.current = null;
    splitStartWidthRef.current = null;
    setIsResizing(false);
    if (event.currentTarget.releasePointerCapture) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  var handleSplitMouseDown = function handleSplitMouseDown(event) {
    event.preventDefault();
    splitStartXRef.current = event.clientX;
    splitStartWidthRef.current = taskListWidth;
    setIsResizing(true);
    if (splitMoveHandlerRef.current) {
      document.removeEventListener("mousemove", splitMoveHandlerRef.current);
    }
    if (splitUpHandlerRef.current) {
      document.removeEventListener("mouseup", splitUpHandlerRef.current);
    }
    var handleMouseMove = function handleMouseMove(moveEvent) {
      updateTaskListWidth(moveEvent.clientX);
    };
    var handleMouseUp = function handleMouseUp() {
      splitStartXRef.current = null;
      splitStartWidthRef.current = null;
      setIsResizing(false);
      if (splitMoveHandlerRef.current) {
        document.removeEventListener("mousemove", splitMoveHandlerRef.current);
        splitMoveHandlerRef.current = null;
      }
      if (splitUpHandlerRef.current) {
        document.removeEventListener("mouseup", splitUpHandlerRef.current);
        splitUpHandlerRef.current = null;
      }
    };
    splitMoveHandlerRef.current = handleMouseMove;
    splitUpHandlerRef.current = handleMouseUp;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  var gridProps = {
    columnWidth: columnWidth,
    svgWidth: svgWidth,
    tasks: tasks,
    rowHeight: rowHeight,
    dates: dateSetup.dates,
    todayColor: todayColor,
    rtl: rtl
  };
  var calendarProps = {
    dateSetup: dateSetup,
    locale: locale,
    viewMode: viewMode,
    headerHeight: headerHeight,
    columnWidth: columnWidth,
    fontFamily: fontFamily,
    fontSize: fontSize,
    rtl: rtl
  };
  var barProps = {
    tasks: barTasks,
    dates: dateSetup.dates,
    ganttEvent: ganttEvent,
    selectedTask: selectedTask,
    rowHeight: rowHeight,
    taskHeight: taskHeight,
    columnWidth: columnWidth,
    arrowColor: arrowColor,
    timeStep: timeStep,
    fontFamily: fontFamily,
    fontSize: fontSize,
    arrowIndent: arrowIndent,
    svgWidth: svgWidth,
    rtl: rtl,
    setGanttEvent: setGanttEvent,
    setFailedTask: setFailedTask,
    setSelectedTask: handleSelectedTask,
    onDateChange: onDateChange,
    onProgressChange: onProgressChange,
    onDoubleClick: onDoubleClick,
    onClick: onClick,
    onDelete: onDelete
  };
  var tableProps = {
    rowHeight: rowHeight,
    rowWidth: listCellWidth,
    fontFamily: fontFamily,
    fontSize: fontSize,
    tasks: barTasks,
    headerHeight: headerHeight,
    scrollY: scrollY,
    horizontalScroll: scrollXLeft,
    ganttHeight: ganttHeight,
    horizontalContainerClass: styles$9.horizontalContainer,
    headerContainerRef: taskListHeaderRef,
    bodyContainerRef: taskListBodyRef,
    onHorizontalScroll: handleScrollLeft,
    selectedTask: selectedTask,
    taskListRef: taskListRef,
    setSelectedTask: handleSelectedTask,
    onExpanderClick: handleExpanderClick,
    TaskListHeader: TaskListHeader,
    TaskListTable: TaskListTable,
    visibleFields: visibleFields,
    onUpdateTask: onTaskUpdate,
    onCellCommit: onCellCommit,
    effortDisplayUnit: effortDisplayUnit,
    enableColumnDrag: enableColumnDrag
  };
  return React__default.createElement("div", null, React__default.createElement("div", {
    className: styles$9.wrapper,
    onKeyDown: handleKeyDown,
    tabIndex: 0,
    ref: wrapperRef
  }, listCellWidth && React__default.createElement("div", {
    className: styles$9.taskListPanel,
    style: {
      width: taskListWidth
    },
    "data-testid": "task-list-panel"
  }, React__default.createElement(TaskList, Object.assign({}, tableProps))), listCellWidth && React__default.createElement("div", {
    className: styles$9.splitHandle + " " + (isResizing ? styles$9.splitHandleActive : ""),
    onPointerDown: supportsPointerEvents ? handleSplitPointerDown : undefined,
    onPointerMove: supportsPointerEvents ? handleSplitPointerMove : undefined,
    onPointerUp: supportsPointerEvents ? handleSplitPointerUp : undefined,
    onPointerCancel: supportsPointerEvents ? handleSplitPointerUp : undefined,
    onMouseDown: supportsPointerEvents ? undefined : handleSplitMouseDown,
    role: "separator",
    "aria-label": "Task/Schedule divider",
    "aria-orientation": "vertical",
    "data-testid": "pane-splitter"
  }), React__default.createElement("div", {
    className: styles$9.ganttPanel,
    style: {
      minWidth: MIN_PANE_WIDTH
    },
    "data-testid": "gantt-panel"
  }, React__default.createElement(TaskGantt, {
    gridProps: gridProps,
    calendarProps: calendarProps,
    barProps: barProps,
    ganttHeight: ganttHeight,
    scrollY: scrollY,
    scrollX: scrollXRight,
    verticalGanttContainerRef: ganttContainerRef
  })), ganttEvent.changedTask && React__default.createElement(Tooltip, {
    arrowIndent: arrowIndent,
    rowHeight: rowHeight,
    svgContainerHeight: svgContainerHeight,
    svgContainerWidth: svgContainerWidth,
    fontFamily: fontFamily,
    fontSize: fontSize,
    scrollX: scrollXRight,
    scrollY: scrollY,
    task: ganttEvent.changedTask,
    headerHeight: headerHeight,
    taskListWidth: taskListOffset,
    TooltipContent: TooltipContent,
    rtl: rtl,
    svgWidth: svgWidth,
    effortDisplayUnit: effortDisplayUnit
  }), React__default.createElement(VerticalScroll, {
    ganttFullHeight: ganttFullHeight,
    ganttHeight: ganttHeight,
    headerHeight: headerHeight,
    scroll: scrollY,
    onScroll: handleScrollY,
    rtl: rtl
  })), React__default.createElement("div", {
    className: styles$9.scrollRow,
    style: {
      "--splitter-width": SPLIT_HANDLE_WIDTH + "px"
    }
  }, React__default.createElement("div", {
    className: styles$9.scrollCellLeft
  }, listCellWidth && React__default.createElement(HorizontalScroll, {
    svgWidth: taskListWidth,
    scrollerWidth: leftScrollerWidth,
    scroll: scrollXLeft,
    rtl: rtl,
    onScroll: handleScrollLeft
  })), listCellWidth && React__default.createElement("div", {
    className: styles$9.scrollSplitter
  }), React__default.createElement("div", {
    className: styles$9.scrollCellRight
  }, React__default.createElement(HorizontalScroll, {
    svgWidth: svgWidth,
    scroll: scrollXRight,
    rtl: rtl,
    onScroll: handleScrollRight
  }))));
};

exports.DEFAULT_VISIBLE_FIELDS = DEFAULT_VISIBLE_FIELDS;
exports.Gantt = Gantt;
exports.TASK_PROCESS_OPTIONS = TASK_PROCESS_OPTIONS;
exports.TASK_STATUS_BADGE_TEXT = TASK_STATUS_BADGE_TEXT;
exports.TASK_STATUS_COLORS = TASK_STATUS_COLORS;
exports.TASK_STATUS_OPTIONS = TASK_STATUS_OPTIONS;
exports.formatDate = formatDate;
exports.formatEffort = formatEffort;
exports.getStatusBadgeText = getStatusBadgeText;
exports.getStatusColor = getStatusColor;
exports.normalizeProcess = normalizeProcess;
exports.normalizeStatus = normalizeStatus;
exports.parseDateFromInput = parseDateFromInput;
exports.resolveVisibleFields = resolveVisibleFields;
exports.sanitizeEffortInput = sanitizeEffortInput;
//# sourceMappingURL=index.js.map
