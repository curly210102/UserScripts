// ==UserScript==
// @name         eBooks Assistant
// @name:zh-CN   豆瓣读书助手
// @namespace    https://github.com/caspartse/eBooksAssistant
// @version      0.14.0
// @description  eBooks Assistant for douban.com
// @description:zh-CN 为豆瓣读书页面添加亚马逊Kindle、微信读书、多看阅读、喜马拉雅等直达链接
// @author       Caspar Tse
// @license      MIT License
// @supportURL   https://github.com/caspartse/eBooksAssistant
// @match        https://book.douban.com/subject/*
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @connect      8.210.234.3
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    var version = "0.14.0";
    var domain = "http://8.210.234.3:8081";

    function changeMargin() {
        if ($('[data-ebassistant="read"]').height() > 36) {
            $('[data-ebassistant="read"]').attr("style", "margin-right:0;");
        }
    }

    // 为提升查询速度，服务器预先缓存了一批数据。
    // 但目前遇到一个问题是，难以保证数据最新的，因为请求量较大，屡屡触发亚马逊的反爬虫机制。
    // 因此，需要借助各位的力量，去中心化地对数据进行校验和更新。下面这个函数，只会更新当前页面书籍的信息。

    // 使用服务器上的资源
    function queryWeread(isbn, title, subtitle, author, translator, publisher) {
        GM_xmlhttpRequest({
            method: "GET",
            url: domain + "/weread?isbn=" + isbn + "&title=" + title + "&subtitle=" + subtitle + "&author=" + author + "&translator=" + translator + "&publisher=" + publisher + "&version=" + version,
            headers: {
                "User-agent": window.navigator.userAgent,
            },
            onload: function(responseDetail) {
                var result = JSON.parse(responseDetail.responseText);
                console.log(result);
                if (result.errmsg == "") {
                    var duokanUrl = result.data.url;
                    var duokanPrice = result.data.price;
                    var partnerTemplate = "";
                    if ($('.online-type[data-ebassistant="read"]').length) {
                        partnerTemplate = '<div class="online-read-or-audio"> <a class="impression_track_mod_buyinfo" target="_blank" href="{templateUrl}"> <img src="https://ebooks-assistant.oss-cn-guangzhou.aliyuncs.com/icon_weread.png" width="16" height="16"> <span>微信读书</span> </a> </div>';
                        $('.online-type[data-ebassistant="read"]').append(partnerTemplate.replace("{templateUrl}", duokanUrl));
                    } else if ($('.online-type[data-ebassistant="audio"]').length) {
                        partnerTemplate = '<div class="online-type" data-ebassistant="read"> <span>在线试读：</span> <div class="online-read-or-audio"> <a class="impression_track_mod_buyinfo" target="_blank" href="{templateUrl}" one-link-mark="yes"> <img src="https://ebooks-assistant.oss-cn-guangzhou.aliyuncs.com/icon_weread.png" width="16" height="16"> <span>微信读书</span> </a> </div></div>';
                        $('.online-type[data-ebassistant="audio"]').before(partnerTemplate.replace("{templateUrl}", duokanUrl));
                    } else {
                        partnerTemplate = '<div class="online-partner"> <div class="online-type" data-ebassistant="read"> <span>在线试读：</span> <div class="online-read-or-audio"> <a class="impression_track_mod_buyinfo" target="_blank" href="{templateUrl}" one-link-mark="yes"> <img src="https://ebooks-assistant.oss-cn-guangzhou.aliyuncs.com/icon_weread.png" width="16" height="16"> <span>微信读书</span> </a> </div></div> </div>';
                        $("#link-report").after(partnerTemplate.replace("{templateUrl}", duokanUrl));
                    }
                    var buyItemTemplate = '<li> <div class="cell price-btn-wrapper"> <div class="vendor-name"> <a target="_blank" href="{templateUrl}"> <span><img src="https://ebooks-assistant.oss-cn-guangzhou.aliyuncs.com/icon_weread.png" style="border-radius: 50%; box-shadow: 0 0 1px 0 rgba(0,0,0,0.6);" width="16" height="16" border="0">&nbsp;微信读书</span> </a> </div> <div class="cell impression_track_mod_buyinfo"> <div class="cell price-wrapper"> <a target="_blank" href="{templateUrl}"> <span class="buylink-price "> {templatePrice}元 </span> </a> </div> <div class="cell"> <a target="_blank" href="{templateUrl}" class="buy-book-btn e-book-btn"> <span>购买电子书</span> </a> </div> </div> </div> </li>';
                    buyItemTemplate = buyItemTemplate.replaceAll("{templateUrl}", duokanUrl);
                    buyItemTemplate = buyItemTemplate.replace("{templatePrice}", duokanPrice);
                    $("#buyinfo ul:nth-child(2)").prepend(buyItemTemplate);
                }
                return;
            }
        });
        changeMargin();
        return;
    }

    function queryLibrary (isbn) {
        console.log("Library");
        GM_xmlhttpRequest({
            method: "GET",
            url: 'https://my1.hzlib.net/opac/api/search?q='+ isbn + '&searchType=standard&isFacet=true&view=standard&searchWay=isbn&rows=10&sortWay=score&sortOrder=desc&searchWay0=marc&logical0=AND&wt=json',
            headers: {
                "User-agent": window.navigator.userAgent,
            },
            onload: function(responseDetail) {
                const libcodes = new Set(["0900"]);
                var result = JSON.parse(responseDetail.responseText);
                var response = result.response;
                console.log(response);
                if (response?.numFound > 0) {
                    const docs = response.docs;
                    docs.forEach(function (doc) {
                        const bookid = doc.id;
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: "https://my1.hzlib.net/opac/book/holdingPreviews?bookrecnos=" + bookid + "&return_fmt=json",
                            headers: {
                              "User-agent": window.navigator.userAgent,
                            },
                            onload: function (responseDetail) {
                               const result = JSON.parse(responseDetail.responseText);
                               const books =result.previews[bookid].filter(item => libcodes.has(item.curlib));
                                console.log(result);
                                books.forEach(function(data) {
                                   const libraryName = data.curlibName + ' ' + data.curlocalName;
                                   const callno = data.callno;
                                   const loanableCount = data.loanableCount;
                                   const copycount = data.copycount;
                                   const bookUrl = 'https://my1.hzlib.net/opac/book/' + bookid;
                                   let buyItemTemplate = '<li> <div class="cell price-btn-wrapper"> <div class="vendor-name"> <a target="_blank" href="{templateUrl}"> <span>{templateLibraryName}</span> </a> </div> <div class="cell impression_track_mod_buyinfo"> <div class="cell price-wrapper"> <a target="_blank" href="{templateUrl}"> <span class="buylink-price "> 可借 {templateLoanable} </span> </a> </div> <div class="cell"> <a target="_blank" href="{templateUrl}" class="buy-book-btn e-book-btn" style="height: auto"> <span>{templateCallno}</span> </a> </div> </div> </div> </li>';
                                   buyItemTemplate = buyItemTemplate.replaceAll("{templateLibraryName}", libraryName);
                                   buyItemTemplate = buyItemTemplate.replaceAll("{templateUrl}", bookUrl);
                                   buyItemTemplate = buyItemTemplate.replace("{templateLoanable}", loanableCount + '/' + copycount);
                                   buyItemTemplate = buyItemTemplate.replace("{templateCallno}", callno);
                                   $("#buyinfo ul:nth-child(2)").prepend(buyItemTemplate);
                               });
                            }
                        });
                    });
                }
            },
            onerror: function (evt) {
                console.log(evt)
            }
        });
    }

    try {
        $(".online-partner .online-type:nth-child(1)").attr("data-ebassistant", "read");
        $(".online-partner .online-type:nth-child(2)").attr("data-ebassistant", "audio");
    } catch(e) {
        console.log(e);
    }
    var newStyle = `<style type="text/css" media="screen">.online-partner{flex-wrap:wrap;padding-top:5px;padding-bottom:5px}.online-type{flex-wrap:wrap}.online-read-or-audio{margin-top:5px;margin-bottom:5px}.online-partner .online-type:nth-child(1){margin-right:20px}.online-partner .online-type:last-child{margin-right:0}.online-partner .online-type:nth-child(2){padding-left:0}[data-ebassistant=read] div:last-child a{margin-right:0}</style>`;
    $("#content").append(newStyle);

    var regexLinkedData = /<script type="application\/ld\+json">([\s\S]+?)<\/script>/gi;
    var linkedData = regexLinkedData.exec(document.documentElement.innerHTML)[1].trim();
    linkedData = JSON.parse(linkedData);
    console.log(linkedData);
    var isbn = linkedData.isbn;
    console.log(isbn);
    var title = linkedData.name;
    console.log(title);
    var subtitle = "";
    try {
        var regexSubtitle = /<span class="pl">\s*副标题:?<\/span>\s*:?\s*([\s\S]+?)<br\/?>/gi;
        subtitle = regexSubtitle.exec(document.documentElement.innerHTML.replace(/&nbsp;/gi, " "))?.[1].trim();
    } catch(e) {
        console.log(e);
    }
    console.log(subtitle);
    var authorStr = "";
    for (var i=0, j=linkedData.author.length; i<j; i++) {
        authorStr += linkedData.author[i].name + " " ;
    }
    var author = authorStr;
    console.log(author);
    var translator = "";
    try {
        var regexTranslator = /<span class="pl">\s*译者:?<\/span>\s*:?\s*<a[^>]+>([\s\S]+?)<\/a>/gi;
        translator = regexTranslator.exec(document.documentElement.innerHTML.replace(/&nbsp;/gi, " "))[1].trim();
    } catch(e) {
        console.log(e);
    }
    console.log(translator);
    var regexPublisher = /<span class="pl">\s*出版社:?<\/span>\s*:?\s*([\s\S]+?)<br\/?>/gi;
    var publisher = regexPublisher.exec(document.documentElement.innerHTML.replace(/&nbsp;/gi, " "))[1].trim();
    console.log(publisher);

    queryWeread(isbn, title, subtitle, author, translator, publisher);
    queryLibrary(isbn);

    return;
})();