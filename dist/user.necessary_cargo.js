// ==UserScript==
// @name         Necessary cargo ships
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Displays necessary cargo ships to move / transport the resources
// @author       JBWKZ2099
// @updateURL    https://raw.githubusercontent.com/JBWKZ2099/ogame-necessary-cargo/master/dist/meta.remaining_fields.js
// @downloadURL  https://raw.githubusercontent.com/JBWKZ2099/ogame-necessary-cargo/master/dist/user.remaining_fields.js
// @supportURL   https://github.com/JBWKZ2099/ogame-necessary-cargo/issues
// @match        *://*.ogame.gameforge.com/game/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    var theHref = location.href;

    /*Only for debug*/
    /*localStorage.removeItem("UV_playerResearch");*/

    /*Check if tech data is on localStorage*/
    if( localStorage.UV_playerResearch===undefined ) {
        /*Redirect to research page*/
        if( theHref.indexOf("research")==-1 ) {
            var researchHref = theHref.split("/game")[0]+"/game/index.php?page=ingame&component=research";
            localStorage._previousURL = theHref;
            window.location.href = researchHref;
        } else {
            localStorage.UV_playerResearch = "";
            var researches = "{";

            $("#technologies_basic ul > li").each(function(i, el){
                var res_id = $(el).attr("data-technology");
                var res_level = $(el).find(".level").attr("data-value");
                researches += `"${res_id}":${parseInt(res_level)},`;
            });

            $("#technologies_drive ul > li").each(function(i, el){
                var res_id = $(el).attr("data-technology");
                var res_level = $(el).find(".level").attr("data-value");
                researches += `"${res_id}":${parseInt(res_level)},`;
            });

            $("#technologies_advanced ul > li").each(function(i, el){
                var res_id = $(el).attr("data-technology");
                var res_level = $(el).find(".level").attr("data-value");
                researches += `"${res_id}":${parseInt(res_level)},`;
            });

            $("#technologies_combat ul > li").each(function(i, el){
                var res_id = $(el).attr("data-technology");
                var res_level = $(el).find(".level").attr("data-value");
                researches += `"${res_id}":${parseInt(res_level)},`;
            });

            researches = researches.slice(0,-1)+"}";

            localStorage.UV_playerResearch = researches;
            window.location.href = localStorage._previousURL;
        }
    } else {
        localStorage.removeItem("_previousURL");

        var resources_hour = {},
        tminutes = 75;
        resources_hour["metal"] = getInfo("metal", tminutes);
        resources_hour["crystal"] = getInfo("crystal", tminutes);
        resources_hour["deuterium"] = getInfo("deuterium", tminutes);

        var metal = resources_hour["metal"][0],
            crystal = resources_hour["crystal"][0],
            deuterium = resources_hour["deuterium"][0],
            metal_hour = resources_hour["metal"][0] + resources_hour["metal"][2],
            crystal_hour = resources_hour["crystal"][0] + resources_hour["crystal"][2],
            deuterium_hour = resources_hour["deuterium"][0] + resources_hour["deuterium"][2],
            researches = JSON.parse( localStorage.UV_playerResearch ),
            hyperspace = researches[114],
            ncp_base = 5000,
            ncg_base = 25000,
            rec_base = 20000,
            pf_base = 10000,
            ncp = 0,
            ncg = 0,
            rec = 0,
            pf = 0,
            player_class = $("#characterclass div.characterclass"),
            bonus_research = (hyperspace*5)/100,
            bonus_class_rec = 0,
            bonus_class_pf = 0,
            bonus_class = 0,
            allres = metal+crystal+deuterium,
            allres_hour = metal_hour+crystal_hour+deuterium_hour,
            css = `
                .necesary-cargo {
                    position: absolute;
                    top: -12px;
                    background: rgba(0,0,0,0.65);
                    width: 100%;
                    text-align: center;
                    font-size: 10px;
                    padding: 1px;
                }

                .necesary-cargo > span { margin-right: 8px; }
                .necesary-cargo > span:nth-child(3) { margin-right: 0 !important; }

                .necesary-cargo .ncp { color: #2FE000; }
                .necesary-cargo .ncg { color: #D43635; }
                .necesary-cargo .rec { color: #A6B8CB; }
                .necesary-cargo .pf { color: #6F9FC8; }

                .ncs-config {
                    position: absolute;
                    top: 0;
                    right: 3px;
                    margin-right: 0 !important;
                    cursor: pointer;
                }

                .ncs-config img {
                    width: 14px;
                    height: 14px;
                    cursor: pointer;
                }
            `;

        if( player_class.hasClass("miner") )
            bonus_class = 0.25;

        if( player_class.hasClass("warrior") ) {
            bonus_class_pf = 0.20;
            bonus_class_pf = pf_base*bonus_class_pf;
        }

        ncp = (ncp_base*bonus_class + ncp_base*bonus_research) + ncp_base;
        ncg = (ncg_base*bonus_class + ncg_base*bonus_research) + ncg_base;
        rec = (bonus_class_rec + rec_base*bonus_research) + rec_base;
        pf = (bonus_class_pf + pf_base*bonus_research) + pf_base;

        var sub_ncp = addDots( Math.ceil(allres/ncp) ),
            sub_ncg = addDots( Math.ceil(allres/ncg) ),
            sub_rec = addDots( Math.ceil(allres/rec) ),
            sub_pf = addDots( Math.ceil(allres/pf) ),
            tot_ncp = addDots( Math.ceil(allres_hour/ncp) ),
            tot_ncg = addDots( Math.ceil(allres_hour/ncg) ),
            tot_rec = addDots( Math.ceil(allres_hour/rec) ),
            tot_pf = addDots( Math.ceil(allres_hour/pf) );

        $(document).find(".necesary-cargo").remove();
        $("html head").append(`<style>${css}</style>`);
        $("#pageContent #resourcesbarcomponent").append(`
            <div class="necesary-cargo">
                <span class="ncp">NCP: ${sub_ncp} (${( sub_ncp==tot_ncp ? 0 : tot_ncp )})</span>
                <span class="ncg">NCG: ${sub_ncg} (${( sub_ncg==tot_ncg ? 0 : tot_ncg )})</span>
                <span class="rec">REC: ${sub_rec} (${( sub_rec==tot_rec ? 0 : tot_rec )})</span>
                <span class="pf">PF: ${sub_pf} (${( sub_pf==tot_pf ? 0 : tot_pf )})</span>

                <!-- <span class="ncs-config">
                    <img src="https://gf3.geo.gfsrv.net/cdne7/1f57d944fff38ee51d49c027f574ef.gif" width="16" height="16">
                </span> -->
            </div>
        `);
    }

    function addDots(nStr) {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + '.' + '$2');
        }
        return x1 + x2;
    }

    function getInfo(type, time = null) {
        var pattern_match=/\">(.*?)<\/span/gi;
        var box_content = $(`#${type}_box`).attr("title").match(pattern_match);
        box_content[0] = $(`#resources_${type}`).html();

        for(i in box_content)
            box_content[i] = parseInt(box_content[i].replace(/[^0-9]+/g, ''));

        if( time!=null && time!="" && typeof time!=="undefined" ) {
            /* backup original value per hour */
            var res_hour = box_content[2];

            /* get resources produced per minute in an hour */
            var res_minute = res_hour / 60;

            /* get resources produced per time given in function call */
            var res_time = res_minute * time;

            /* assign new val */
            box_content[2] = res_time;
        }

        return box_content;
    }
})();
