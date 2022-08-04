// ==UserScript==
// @name         Necessary cargo ships
// @namespace    necessary_cargo
// @version      1.5
// @description  Displays necessary cargo ships to move / transport the resources
// @author       JBWKZ2099
// @homepageURL  https://github.com/JBWKZ2099/ogame-necessary-cargo
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
    var lang = theHref.split(".ogame.gameforge")[0].split("://")[1].split("-")[1];
    var uni = theHref.split(".ogame.gameforge")[0].split("://")[1].split("-")[0];
    var _localstorage_varname = `__LS_${uni}_${lang}_necessaryCargo`;
    // localStorage.removeItem(_localstorage_varname);
    var _LS_val = {};

    var settings = null;

    if( localStorage.getItem(_localstorage_varname) )
        settings = JSON.parse(localStorage.getItem(_localstorage_varname));

    if( settings===undefined || settings==null || settings=="" ) {
        var conf = {};
        settings = {};

        conf["time"] = "60";
        conf["fixed_qty_checkbox"] = false;
        conf["fleet_per_planet"] = true;
        conf["fleet_per_galaxy"] = true;
        conf["full_fleet"] = true;
        conf["ncp_qty"] = "0";
        conf["ncg_qty"] = "0";
        conf["rec_qty"] = "0";
        conf["pf_qty"] = "0";

        settings["config"] = JSON.stringify(conf);

        localStorage.setItem(_localstorage_varname, JSON.stringify(settings));
    }

    settings = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config );

    /*Only for debug*/
    /*localStorage.removeItem("UV_playerResearch");*/
    /*localStorage.removeItem("__LS_s130_mx_necessaryCargo");*/

    /*Check if tech data is on localStorage*/
    if( typeof localStorage.UV_playerResearch==="undefined" ) {
        /*Redirect to research page*/
        if( theHref.indexOf("research")==-1 ) {
            var researchHref = theHref.split("/game")[0]+"/game/index.php?page=ingame&component=research";
            localStorage._previousURL_necessaryCargo = theHref;
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
            window.location.href = localStorage._previousURL_necessaryCargo;
        }
    } else {
        localStorage.removeItem("_previousURL_necessaryCargo");

        var resources_hour = {};
        resources_hour["metal"] = getInfo("metal");
        resources_hour["crystal"] = getInfo("crystal");
        resources_hour["deuterium"] = getInfo("deuterium");

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

                .ncs-text-center {
                    text-align: center !important;
                }

                .tbl-necesary-cargo {
                    width: 639px;
                    padding: 0 7px 4px;
                    margin: 10px 0 5px 15px;
                    vertical-align: top;
                    border: 1px solid #050505;
                    border-radius: 5px;
                    background: linear-gradient(to bottom, #192026 0, #0d1014 13%, #0d1014 100%);
                    position: relative;
                    z-index: 2;
                }

                .tbl-necesary-cargo thead th { padding-top: 5px; padding-bottom: 10px; }
                .tbl-necesary-cargo tbody > tr > td { padding-top: 2px; padding-bottom: 2px; color: #848484; font-size: 10px !important; }
                .tbl-necesary-cargo tbody > tr > td { border: 1px solid transparent; }
                .tbl-necesary-cargo tbody > tr > td:first-child {
                    border-top-left-radius: 3px;
                    border-bottom-left-radius: 3px;
                }
                .tbl-necesary-cargo tbody > tr > td:last-child {
                    border-top-right-radius: 3px;
                    border-bottom-right-radius: 3px;
                }
                .tbl-necesary-cargo tbody > tr:hover > td,
                .tbl-necesary-cargo tbody > tr.current > td {
                    color: #2FE000;
                    background-color: #182028;
                }

                .tbl-necesary-cargo tbody > tr.current > td {
                    border-top: 1px solid #2FE000;
                    border-bottom: 1px solid #2FE000;
                }
                .tbl-necesary-cargo tbody > tr.current > td:first-child {
                    border-left: 1px solid #2FE000;
                }
                .tbl-necesary-cargo tbody > tr.current > td:last-child {
                    border-right: 1px solid #2FE000;
                }

                .ncs-text-blue { color: #6f9fc8 !important; }
                .btn-sub, .btn-tot { cursor: pointer; }

                .ncs-planet-img {
                    width: 27px;
                    margin-left: 5px;
                    background-size: 81px 44px;
                }

                .ncs-koords span {
                    margin-left: 5px;
                    background: url("https://gf2.geo.gfsrv.net/cdn40/b63220183e356430158dc998a2bb99.gif") no-repeat 0 0;
                    background-size: 70px 39px;
                    display: inline-block;
                    cursor: pointer;
                    vertical-align: middle;
                }
                .ncs-koords span.planet {
                    width: 24px;
                    height: 20px;
                    background-position: 0 0;
                }
                .ncs-koords span.moon {
                    width: 19px;
                    height: 20px;
                    background-position: -26px 0;
                }

                .ncs-koords span.planet.selected { background-position: 0 -19px; }
                .ncs-koords span.moon.selected { background-position: -26px -19px; }
                .ncs-clear-cont {
                    position: relative;
                    z-index: 100;
                    width: calc( 100% - 40px );
                    text-align: center;
                    padding: 15px;
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

        /* If fixed qty is setted, then resources produced in an hour will not be considered, just the current production */
        if( settings.fixed_qty_checkbox )
            allres_hour = allres;

        var sub_ncp = addDots( Math.ceil(allres/ncp) ),
            sub_ncg = addDots( Math.ceil(allres/ncg) ),
            sub_rec = addDots( Math.ceil(allres/rec) ),
            sub_pf = addDots( Math.ceil(allres/pf) ),
            tot_ncp = addDots( Math.ceil( (allres_hour/ncp)+parseInt(settings.ncp_qty) ) ),
            tot_ncg = addDots( Math.ceil( (allres_hour/ncg)+parseInt(settings.ncg_qty) ) ),
            tot_rec = addDots( Math.ceil( (allres_hour/rec)+parseInt(settings.rec_qty) ) ),
            tot_pf = addDots( Math.ceil( (allres_hour/pf)+parseInt(settings.pf_qty) ) );

        $(document).find(".necesary-cargo").remove();
        $("html head").append(`<style>${css}</style>`);
        $("#pageContent #resourcesbarcomponent").append(`
            <div class="necesary-cargo">
                <span class="ncp">NPC: ${sub_ncp} (${( sub_ncp==tot_ncp ? 0 : tot_ncp )})</span>
                <span class="ncg">NGC: ${sub_ncg} (${( sub_ncg==tot_ncg ? 0 : tot_ncg )})</span>
                <span class="rec">REC: ${sub_rec} (${( sub_rec==tot_rec ? 0 : tot_rec )})</span>
                <span class="pf">PF: ${sub_pf} (${( sub_pf==tot_pf ? 0 : tot_pf )})</span>

                <span id="ncs-config" class="ncs-config">
                    <img src="https://gf3.geo.gfsrv.net/cdne7/1f57d944fff38ee51d49c027f574ef.gif" width="16" height="16">
                </span>
            </div>
        `);
    }

    $(document).on("click", "#ncs-config", function(e){
        e.preventDefault();
        var main_content_div = "#middle .maincontent > div";

        if( theHref.indexOf("/game/index.php?page=ingame&component=fleetdispatch")>-1 ) {
            main_content_div = `#middle .maincontent > div#fleet1`;
        }

        if( !$(document).find("#ncsp_window").is(":visible") ) {
            $(main_content_div).hide();
            $(".maincontent").css({"z-index": "10"});
            $(document).find("#ncsp_window").show();
            $(this).addClass("selected");
        } else {
            $(".maincontent").removeAttr("style");
            $(document).find("#ncsp_window").hide();
            $(main_content_div).show();
            $(".dinamic-jbwkz2099").hide();
            $(this).removeClass("selected");
        }
    });

    $(document).on("click", "#ncsp_checkbox_qty", function(e){
        $(`input[name="ncp_qty"]`).val("");
        $(`input[name="ncg_qty"]`).val("");
        $(`input[name="rec_qty"]`).val("");
        $(`input[name="pf_qty"]`).val("");

        if( $(this).prop("checked") )
            $(".ncsp-cargo-qty-input").show();
        else
            $(".ncsp-cargo-qty-input").hide();
    });

    $(document).on("click", "#ncsp_btn_save", function(e){
        e.preventDefault();

        var time = $(document).find("#ncsp_time_qty").val(),
            fixed_qty_checkbox = $(document).find("#ncsp_checkbox_qty").prop("checked") ? true : false,
            ncp_qty = "0",
            ncg_qty = "0",
            rec_qty = "0",
            pf_qty = "0",
            fleet_per_planet = $(document).find("#fleet_per_planet").prop("checked") ? true : false,
            fleet_per_galaxy = $(document).find("#fleet_per_galaxy").prop("checked") ? true : false,
            full_fleet = $(document).find("#full_fleet").prop("checked") ? true : false;

        if( fixed_qty_checkbox ) {
            ncp_qty = $(`input[name="ncp_qty"]`).val();
            ncg_qty = $(`input[name="ncg_qty"]`).val();
            rec_qty = $(`input[name="rec_qty"]`).val();
            pf_qty = $(`input[name="pf_qty"]`).val();
        }

        var new_settings = {};

        settings.time = time;
        settings.fixed_qty_checkbox = fixed_qty_checkbox;
        settings.ncp_qty = ncp_qty;
        settings.ncg_qty = ncg_qty;
        settings.rec_qty = rec_qty;
        settings.pf_qty = pf_qty;
        settings.fleet_per_planet = fleet_per_planet;
        settings.fleet_per_galaxy = fleet_per_galaxy;
        settings.full_fleet = full_fleet;

        new_settings["config"] = JSON.stringify(settings);
        localStorage.setItem(_localstorage_varname, JSON.stringify(new_settings));

        $(document).find("#ncsp_close").click();

        $(document).find(".necesary-cargo").append(`<div class="ncsp-msg-saved">¡Guardado!</div>`);

        setTimeout(function(){
            $(document).find(".ncsp-msg-saved").remove();
            window.location.reload();
        }, 3500);
    });

    $(document).on("click", "#ncsp_close, #ncsp_btn_cancel", function(e){
        e.preventDefault();
        var main_content_div = "#middle .maincontent > div";

        if( theHref.indexOf("/game/index.php?page=ingame&component=fleetdispatch")>-1 ) {
            main_content_div = `#middle .maincontent > div#fleet1`;
        }

        if( $(document).find("#ncsp_window").is(":visible") ) {
            $(".maincontent").removeAttr("style");
            $(main_content_div).show();
            $(".dinamic-jbwkz2099").hide();
            $(document).find("#ncsp_window").hide();
        }
    });




    /*Funcionalidad para almacenar la cantidad de naves necesarias en cada planeta*/
        var current_settings = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config );
        var myPlanetList = {};
        var new_pl_sett = {};
        var planetKoords = $("#myPlanets #planetList > div.hightlightPlanet .planet-koords").text();
        var moonKoords = $("#myPlanets #planetList > div.hightlightMoon .planet-koords").length;
        var _moonKoords = $("#myPlanets #planetList > div.hightlightMoon .planet-koords").text();

        if( typeof current_settings["planetList"]==="undefined" ) {
            var plist = {};
            var new_sett = {};

            current_settings["planetList"] = {};
            new_sett["config"] = JSON.stringify(current_settings);
            localStorage.setItem(_localstorage_varname, JSON.stringify(new_sett));
            myPlanetList[planetKoords] = {};
        } else {
            if( moonKoords==0 ) {
                myPlanetList = settings.planetList;
                myPlanetList[planetKoords] = {};
            }
        }

        if( moonKoords==0 ) {
            myPlanetList[planetKoords]["sub_ncp"] = sub_ncp;
            myPlanetList[planetKoords]["sub_ncg"] = sub_ncg;
            myPlanetList[planetKoords]["sub_rec"] = sub_rec;
            myPlanetList[planetKoords]["sub_pf"] = sub_pf;

            myPlanetList[planetKoords]["tot_ncp"] = tot_ncp;
            myPlanetList[planetKoords]["tot_ncg"] = tot_ncg;
            myPlanetList[planetKoords]["tot_rec"] = tot_rec;
            myPlanetList[planetKoords]["tot_pf"] = tot_pf;

            current_settings["planetList"] = myPlanetList;
            new_pl_sett["config"] = JSON.stringify(current_settings);
            localStorage.setItem(_localstorage_varname, JSON.stringify(new_pl_sett));
        }

        /*Se podrá borrar en la siguiente actualización del script*/
        if( typeof current_settings.fleet_per_planet==="undefined" || typeof current_settings.fleet_per_galaxy==="undefined" || typeof current_settings.full_fleet==="undefined" ) {
            var added_settings = {};
            var new_sett = {};
            added_settings = current_settings;

            added_settings["fleet_per_planet"] = false;
            added_settings["fleet_per_galaxy"] = false;
            added_settings["full_fleet"] = false;

            new_sett["config"] = JSON.stringify(added_settings);
            localStorage.setItem(_localstorage_varname, JSON.stringify(new_sett));
        }
        /*Se podrá borrar en la siguiente actualización del script*/

        if( theHref.indexOf("/game/index.php?page=ingame&component=fleetdispatch")>-1 ) {
            if( current_settings.fleet_per_planet===true || current_settings.fleet_per_galaxy===true || current_settings.full_fleet===true ) {
                var plist = null;
                var plist = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config ).planetList;
                plist = sortObjectByKeys(plist);
                var count_sub_npc = 0,
                    count_sub_ngc = 0,
                    count_sub_rec = 0,
                    count_sub_pf = 0,
                    count_tot_npc = 0,
                    count_tot_ngc = 0,
                    count_tot_rec = 0,
                    count_tot_pf = 0;
                var galaxies = [];

                var table_plist = `
                    <div class="ncs-text-center" style="margin-top:15px;">
                        <a href="#" class="btn_blue" id="set-expedition-config" style="color:#FFF !important;">
                            Flotas para Expedición
                        </a>
                    </div>

                    <table class="tbl-necesary-cargo" style="${(current_settings.fleet_per_planet ? "" : "display:none;" )}">
                        <thead>
                            <tr>
                                <th colspan="5" class="ncs-text-center ncs-text-blue">NCS - Cantidad de flota por planeta</th>
                            </tr>
                            <tr>
                                <th class="ncs-text-center ncs-text-blue">Objetivos</th>
                                <th class="ncs-text-center ncs-text-blue tbl-th-npc">NPC <br> <span style="${(!settings.full_fleet ? "display:none;" : "")}">%count_sub_npc% |</span> %count_tot_npc%</th>
                                <th class="ncs-text-center ncs-text-blue tbl-th-ngc">NGC <br> <span style="${(!settings.full_fleet ? "display:none;" : "")}">%count_sub_ngc% |</span> %count_tot_ngc%</th>
                                <th class="ncs-text-center ncs-text-blue tbl-th-rec">REC <br> <span style="${(!settings.full_fleet ? "display:none;" : "")}">%count_sub_rec% |</span> %count_tot_rec%</th>
                                <th class="ncs-text-center ncs-text-blue tbl-th-pf">PF <br> <span style="${(!settings.full_fleet ? "display:none;" : "")}">%count_sub_pf% |</span> %count_tot_pf%</th>
                            </tr>
                        </thead>
                        <tbody>`;

                $.each(plist, function(i, el) {
                    var galaxy = (i.split("[")[1]).split(":")[0];
                    galaxies.push(galaxy);

                    table_plist += `
                        <tr class="${( i==planetKoords || i==_moonKoords ? "current" : "" )}"">
                            <td class="ncs-text-center ncs-koords" valign="middle">
                                ${i}

                                <span class="planet"></span>
                                <span class="moon selected"></span>
                            </td>
                            <td class="ncs-text-center">
                                <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                    <span class="btn-sub ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="sub" data-type="202" data-val="${(el.sub_ncp).replace(".","")}">${el.sub_ncp}</span> |
                                </span>
                                <span class="btn-tot ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="tot" data-type="202" data-val="${(el.tot_ncp).replace(".","")}">${el.tot_ncp}</span>
                            </td>
                            <td class="ncs-text-center">
                                <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                    <span class="btn-sub ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="sub" data-type="203" data-val="${(el.sub_ncg).replace(".","")}">${el.sub_ncg}</span> |
                                </span>
                                <span class="btn-tot ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="tot" data-type="203" data-val="${(el.tot_ncg).replace(".","")}">${el.tot_ncg}</span>
                            </td>
                            <td class="ncs-text-center">
                                <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                    <span class="btn-sub ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="sub" data-type="209" data-val="${(el.sub_rec).replace(".","")}">${el.sub_rec}</span> |
                                </span>
                                <span class="btn-tot ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="tot" data-type="209" data-val="${(el.tot_rec).replace(".","")}">${el.tot_rec}</span>
                            </td>
                            <td class="ncs-text-center">
                                <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                    <span class="btn-sub ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="sub" data-type="219" data-val="${(el.sub_pf).replace(".","")}">${el.sub_pf}</span> |
                                </span>
                                <span class="btn-tot ncs-setup-ship" data-galaxy="${galaxy}" data-cargo-type="tot" data-type="219" data-val="${(el.tot_pf).replace(".","")}">${el.tot_pf}</span>
                            </td>
                        </tr>
                    `;

                    count_sub_npc += parseInt( (el.sub_ncp).replace(".", "") );
                    count_sub_ngc += parseInt( (el.sub_ncg).replace(".", "") );
                    count_sub_rec += parseInt( (el.sub_rec).replace(".", "") );
                    count_sub_pf += parseInt( (el.sub_pf).replace(".", "") );

                    count_tot_npc += parseInt( (el.tot_ncp).replace(".", "") );
                    count_tot_ngc += parseInt( (el.tot_ncg).replace(".", "") );
                    count_tot_rec += parseInt( (el.tot_rec).replace(".", "") );
                    count_tot_pf += parseInt( (el.tot_pf).replace(".", "") );

                    console.log( (el.tot_ncp).replace(".", "") );

                });

                // console.log( count_sub_npc );
                // console.log( count_sub_ngc );
                // console.log( count_sub_rec );
                // console.log( count_sub_pf );
                // console.log( count_tot_npc );
                // console.log( count_tot_ngc );
                // console.log( count_tot_rec );
                // console.log( count_tot_pf );

                table_plist += `
                        </tbody>
                    </table>

                    <div class="ncs-clear-cont">
                        <a id="ncsp-clear-tbl-data" href="#">Eliminar datos</a>
                    </div>
                `;

                table_plist = table_plist.replace("%count_sub_npc%", count_sub_npc);
                table_plist = table_plist.replace("%count_sub_ngc%", count_sub_ngc);
                table_plist = table_plist.replace("%count_sub_rec%", count_sub_rec);
                table_plist = table_plist.replace("%count_sub_pf%", count_sub_pf);
                table_plist = table_plist.replace("%count_tot_npc%", count_tot_npc);
                table_plist = table_plist.replace("%count_tot_ngc%", count_tot_ngc);
                table_plist = table_plist.replace("%count_tot_rec%", count_tot_rec);
                table_plist = table_plist.replace("%count_tot_pf%", count_tot_pf);

                var new_galaxies = galaxies.filter(function(element,index,self){
                    return index === self.indexOf(element);
                });

                if( $(document).find("#ago_shortcuts").length>0 ) {
                    $(document).find("#ago_shortcuts").after(table_plist);
                } else {
                    $(document).find("#allornone").append(table_plist);
                }

                /*Conteo de naves por galaxia*/
                    var ships = {};
                    var ship_count_html = "";

                    $.each(new_galaxies, function(i, e){
                        var g = parseInt(e);
                        ships[`G${g}`] = {};
                        ships[`G${g}`]["sub_npc"] = 0;
                        ships[`G${g}`]["sub_ngc"] = 0;
                        ships[`G${g}`]["sub_rec"] = 0;
                        ships[`G${g}`]["sub_pf"] = 0;
                        ships[`G${g}`]["tot_npc"] = 0;
                        ships[`G${g}`]["tot_ngc"] = 0;
                        ships[`G${g}`]["tot_rec"] = 0;
                        ships[`G${g}`]["tot_pf"] = 0;
                    });

                    $.each(new_galaxies, function(i, e){
                        var g = parseInt(e);

                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="sub"][data-type="202"]`).each(function(i2, e2){
                            ships[`G${g}`]["sub_npc"] += parseInt($(e2).attr("data-val"));
                        });

                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="sub"][data-type="203"]`).each(function(i2, e2){
                            ships[`G${g}`]["sub_ngc"] += parseInt($(e2).attr("data-val"));
                        });

                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="sub"][data-type="209"]`).each(function(i2, e2){
                            ships[`G${g}`]["sub_rec"] += parseInt($(e2).attr("data-val"));
                        });

                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="sub"][data-type="219"]`).each(function(i2, e2){
                            ships[`G${g}`]["sub_pf"] += parseInt($(e2).attr("data-val"));
                        });



                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="tot"][data-type="202"]`).each(function(i2, e2){
                            ships[`G${g}`]["tot_npc"] += parseInt($(e2).attr("data-val"));
                        });

                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="tot"][data-type="203"]`).each(function(i2, e2){
                            ships[`G${g}`]["tot_ngc"] += parseInt($(e2).attr("data-val"));
                        });

                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="tot"][data-type="209"]`).each(function(i2, e2){
                            ships[`G${g}`]["tot_rec"] += parseInt($(e2).attr("data-val"));
                        });

                        $(".tbl-necesary-cargo").find(`[data-galaxy="${g}"][data-cargo-type="tot"][data-type="219"]`).each(function(i2, e2){
                            ships[`G${g}`]["tot_pf"] += parseInt($(e2).attr("data-val"));
                        });
                    });

                    ship_count_html += `
                        <table class="tbl-necesary-cargo" style="${(current_settings.fleet_per_galaxy ? "" : "display:none;" )}">
                            <thead>
                                <th colspan="5" class="ncs-text-center ncs-text-blue">NCS - Cantidad de flota por Galaxia</th>
                            </thead>
                            <tbody>
                                <tr>
                                    <th class="ncs-text-center ncs-text-blue">Galaxia</th>
                                    <th class="ncs-text-center ncs-text-blue">NPC</th>
                                    <th class="ncs-text-center ncs-text-blue">NGC</th>
                                    <th class="ncs-text-center ncs-text-blue">REC</th>
                                    <th class="ncs-text-center ncs-text-blue">PF</th>
                                </tr>`;

                    $.each(ships, function(i, e){
                        ship_count_html += `
                                <tr>
                                    <td class="ncs-text-center">${i}</td>`;

                        ship_count_html += `
                                    <td class="ncs-text-center">
                                        <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_npc} |
                                        </span>
                                        ${e.tot_npc}
                                    </td>
                                    <td class="ncs-text-center">
                                        <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_ngc} |
                                        </span>
                                        ${e.tot_ngc}
                                    </td>
                                    <td class="ncs-text-center">
                                        <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_rec} |
                                        </span>
                                        ${e.tot_rec}
                                    </td>
                                    <td class="ncs-text-center">
                                        <span style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_pf} |
                                        </span>
                                        ${e.tot_pf}
                                    </td>`;

                        ship_count_html += `
                                </tr>
                        `;
                    });

                    ship_count_html += `
                            </tbody>
                        <table>
                    `;
                /*Conteo de naves por galaxia*/

                if( ship_count_html.length>0 ) {
                    $(document).find(".tbl-necesary-cargo").after(ship_count_html);
                }
            }
        }

        $(document).on("click", "#set-expedition-config", function(e){
            $("#position").val(16).keyup();
            simulateMouseClick( $("#missionButton15") );

            $(document).find(`li.technology > input`).val("").keyup();

            /*
                204 => Lig
                205 => Pes
                206 => Cru
                207 => Nb
                215 => Bb
                211 => Des
                213 => Aco
                218 => RR
                219 => PF
            */
            $(document).find(`li.technology[data-technology=204][data-status="on"] > input`).focus().val(10);
            $(document).find(`li.technology[data-technology=205][data-status="on"] > input`).focus().val(10);
            $(document).find(`li.technology[data-technology=206][data-status="on"] > input`).focus().val(1);
            $(document).find(`li.technology[data-technology=207][data-status="on"] > input`).focus().val(1);
            $(document).find(`li.technology[data-technology=215][data-status="on"] > input`).focus().val(1);
            $(document).find(`li.technology[data-technology=211][data-status="on"] > input`).focus().val(1);
            $(document).find(`li.technology[data-technology=213][data-status="on"] > input`).focus().val(1);
            $(document).find(`li.technology[data-technology=218][data-status="on"] > input`).focus().val(1);
            $(document).find(`li.technology[data-technology=219][data-status="on"] > input`).focus().val(1);

            /*
                202 => NPC
                203 => NGC
                210 => Son
            */
            $(document).find(`li.technology[data-technology=202][data-status="on"] > input`).focus().val(200);
            $(document).find(`li.technology[data-technology=203][data-status="on"] > input`).focus().val(200);
            $(document).find(`li.technology[data-technology=210][data-status="on"] > input`).focus().val(100);

            $(document).find("#continueToFleet2").focus();
        });

        $(document).on("click", "#ncsp-clear-tbl-data", function(e){
            e.preventDefault();

            var current_settings = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config );
            var plist = {};
            var new_sett = {};

            current_settings["planetList"] = {};
            new_sett["config"] = JSON.stringify(current_settings);
            localStorage.setItem(_localstorage_varname, JSON.stringify(new_sett));

            $(document).find(".tbl-necesary-cargo thead").find(".tbl-th-npc").empty().append(`
                <th class="ncs-text-center ncs-text-blue tbl-th-npc">NPC <br> - | -</th>
            `);
            $(document).find(".tbl-necesary-cargo thead").find(".tbl-th-ngc").empty().append(`
                <th class="ncs-text-center ncs-text-blue tbl-th-ngc">NGC <br> - | -</th>
            `);
            $(document).find(".tbl-necesary-cargo thead").find(".tbl-th-rec").empty().append(`
                <th class="ncs-text-center ncs-text-blue tbl-th-rec">REC <br> - | -</th>
            `);
            $(document).find(".tbl-necesary-cargo thead").find(".tbl-th-pf").empty().append(`
                <th class="ncs-text-center ncs-text-blue tbl-th-pf">PF <br> - | -</th>
            `);

            $(document).find(".tbl-necesary-cargo tbody").empty().append(`
                <tr>
                    <td colspan="5" style="text-align:center">No available data</td>
                </tr>
            `);
        });

        $(document).on("click", ".ncs-setup-ship", function(e){
            var _val = $(this).attr("data-val");
            var _type = $(this).attr("data-type");
            var coords = (($(this).parent().parent().find(".ncs-koords").text()).split("[")[1]).split("]")[0];
            var selected = $(this).parent().parent().find(".ncs-koords .selected");

            $(document).find(`li.technology > input`).val("").keyup();
            $(document).find(`li.technology[data-technology=${_type}][data-status="on"] > input`).focus().val(_val);
            $(document).find("#continueToFleet2").focus();

            if( $(document).find("#ago_shortcuts").length>0 ) {
                var selected_target = selected.hasClass("moon") ? "moon" : "name";
                simulateMouseClick( $(document).find(`.ago_shortcuts_own a[rel="${coords}"] .ago_shortcuts_${selected_target}`) );
            }
        });

        $(document).on("click", ".ncs-koords > span", function(e){
            e.preventDefault();

            $(this).parent().find("span").removeClass("selected");
            $(this).addClass("selected");
        });
    /*Funcionalidad para almacenar la cantidad de naves necesarias en cada planeta*/

    /* Styles for config panel */
    $("html head").append(`
        <style>
            .simulate-button { cursor: pointer; }
            #ncsp_window {
                float: left;
                position: relative;
                width: 670px;
                overflow: visible;
                z-index: 2;
            }
            #ncsp_header {
                height: 28px;
                position: relative;
                background: url("https://gf1.geo.gfsrv.net/cdn63/10e31cd5234445e4084558ea3506ea.gif") no-repeat scroll 0px 0px transparent;
            }
            #ncsp_header h4 {
                height: 28px;
                line-height: 28px;
                text-align: center;
                color: #6F9FC8;
                font-size: 12px;
                font-weight: bold;
                position: absolute;
                top: 0;
                left: 100px;
                right: 100px;
            }
            #ncsp_config_but {
                display: block;
                height: 16px;
                width: 16px;
                background: url("https://gf3.geo.gfsrv.net/cdne7/1f57d944fff38ee51d49c027f574ef.gif");
                float: right;
                margin: 8px 0 0 0;
                opacity: 0.5;
            }
            #ncsp_main {
                padding: 15px 25px 0 25px;
                background: url("https://gf1.geo.gfsrv.net/cdn9e/4f73643e86a952be4aed7fdd61805a.gif") repeat-y scroll 5px 0px transparent;
            }
            #ncsp_window.dinamic-jbwkz2099 table {
                border: 1px solid #000;
                margin: 0 0 20px 0;
            }
            #ncsp_window.dinamic-jbwkz2099 table.last {
                margin: 0;
            }
            #ncsp_window table {
                width: 620px;
                background-color: #0D1014;
                border-collapse: collapse;
                clear: both;
            }
            #ncsp_main * {
                font-size: 11px;
            }
            #ncsp_main tr, #ncsp_main td, #ncsp_main th {
                height: 28px;
                line-height: 28px;
            }
            #ncsp_main th {
                color: #6F9FC8;
                text-align: center;
                font-weight: bold;
            }
            .ncsp_label {
                padding: 0 5px 0 5px;
                font-weight: bold;
            }
            .ncsp_label, .ncsp_label * {
                color: grey;
                text-align: left;
            }
            .ncsp_select {
                width: 150px;
                text-align: left;
            }
            .ncsp_input, .ncsp_output {
                width: 112px;
                padding: 0 2px 0 0;
            }
            .ncsp_input, .ncsp_checkbox { text-align: center; }
            #ncsp_main input[type="text"] {
                width: 100px;
                text-align: center;
            }
            #ncsp_footer {
                height: 17px;
                background: url("https://gf1.geo.gfsrv.net/cdn30/aa3e8edec0a2681915b3c9c6795e6f.gif") no-repeat scroll 2px 0px transparent;
            }

            a.ncsp_menu_button {
                padding: 3px 5px;
                min-width: 204px;
            }
            .no-touch .btn_blue:hover, .btn_blue:active, .no-touch input.btn_blue:hover, input.btn_blue:active, .no-touch .ui-button:hover, .ui-button:active {
                background: #59758f url(//gf2.geo.gfsrv.net/cdn71/f31afc3….png) 0 -27px repeat-x;
                background: -moz-linear-gradient(top, #6e87a0 0%, #5d7ea2 17%, #7897b1 50%, #57799c 54%, #56789e 59%, #6a89ac 82%, #89a4bd 100%);
                background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#6e87a0), color-stop(17%,#5d7ea2), color-stop(50%,#7897b1), color-stop(54%,#57799c), color-stop(59%,#56789e), color-stop(82%,#6a89ac), color-stop(100%,#89a4bd));
                background: -webkit-linear-gradient(top, #6e87a0 0%,#5d7ea2 17%,#7897b1 50%,#57799c 54%,#56789e 59%,#6a89ac 82%,#89a4bd 100%);
                background: -o-linear-gradient(top, #6e87a0 0%,#5d7ea2 17%,#7897b1 50%,#57799c 54%,#56789e 59%,#6a89ac 82%,#89a4bd 100%);
                background: -ms-linear-gradient(top, #6e87a0 0%,#5d7ea2 17%,#7897b1 50%,#57799c 54%,#56789e 59%,#6a89ac 82%,#89a4bd 100%);
                background: linear-gradient(to bottom, #6e87a0 0%,#5d7ea2 17%,#7897b1 50%,#57799c 54%,#56789e 59%,#6a89ac 82%,#89a4bd 100%);
                border-color: #7E94AC #627F9C #546A7E #7494B4;
                color: #fff;
                text-shadow: 0 1px 2px #354a5e, 0 0 7px #8ca3bb;
            }
            .ncsp_label {
                padding: 0 5px 0 5px;
                font-weight: bold;
            }
            .ncsp_label, .ncsp_label * {
              color: grey;
              text-align: left;
            }
            .ncsp_cursor_help { cursor: help; }
            .ncsp_below_resource_icon {
                font-size: 9px;
                bottom: -10px;
                position: relative;
            }
            .ncsp-msg-saved {
                color: #2FE000;
                font-weight: bold;
                background-color: rgba(0,0,0,0.65);
            }
        </style>
    `);

    /* HTML for config panel */
    var extra_cargo_qty_tooltip = `Adicionar tiempo|<ol><li>Se calcularán los recursos generados en el lapso de tiempo establecido para sumar la cantidad de naves extra que se deben enviar.</li><li><b>Nota:</b> El tiempo establecido debe ser en minutos. <br> <b>Es importante tener en cuenta que si se actualiza este dato, se deberán recorrer nuevamente los planetas para ajustar las cantidades en la tabla de la pantalla de flota.</b></li></ol>`,
        set_cargo_qty_tooltip = `Cantidad de naves|<ol><li>Los valores especificados en cada uno de los campos a continuación se adicionarán al total de naves; es decir, si se requieren 100 NCP y se especifican 50 en el campo correspondiente, el total de naves será ahora 150.</li><li><b>Nota:</b> El tiempo establecido se ignorará y únicamente se sumarán las cantidades de naves especificadas en los campos respectivos. <br> <b>Es importante tener en cuenta que si se actualiza este dato, se deberán recorrer nuevamente los planetas para ajustar las cantidades en la tabla de la pantalla de flota.</b></li></ol>`,
        fleet_per_planet_tooltip = `Flota por planeta|<ol><li>Se mostrará la cantidad de flota necesaria para transportar los recursos en una tabla en la pantalla de Flota.</li></ol>`,
        fleet_per_galaxy_tooltip = `Flota por galaxia|<ol><li>Se mostrará la cantidad de flota necesaria para transportar los recursos en una tabla en la pantalla de Flota. Este dato calcula la flota necesaria por galaxia para realizar el salto de las naves (Ejemplo: Si se tienen 5 planetas en G1 y la flota principal se encuentra en G3, se calculan las naves necesarias para transportar todos los recursos de G1 y realizar el salto de las naves necesarias que se encuentran en G3).</li></ol>`,
        full_fleet_tooltip = `Flota completa|<ol><li>Se mostrará la cantidad de flota con y sin las naves adicionales para los recursos generados en cierto tiempo (este dato se configura en el campo 'Adicionar Tiempo').</li></ol>`;

    $("#middle .maincontent").prepend(`
        <div id="ncsp_window" class="dinamic-jbwkz2099" style="display:none;">
            <div id="ncsp_header">
                <h4>Naves necesarias para el transporte<span class="o_trade_calc_config_only"> » Configuración</span></h4>
                <a id="ncsp_close" href="#" class="close_details close_ressources"></a>
            </div>

            <div id="ncsp_main">
                <div id="ncsp">

                    <table cellspacing="0" cellpadding="0">
                        <tbody>
                            <tr>
                                <td class="ncsp_label">
                                    <span class="ncsp_cursor_help tooltipHTML tpd-hideOnClickOutside" title="${extra_cargo_qty_tooltip}">
                                        Tiempo adicional para naves extra
                                    </span>
                                </td>
                                <td class="ncsp_input">
                                    <input id="ncsp_time_qty" type="text" value="${settings.time}">
                                </td>
                            </tr>
                            <tr class="alt">
                                <td class="ncsp_label">
                                    <span class="ncsp_cursor_help tooltipHTML tpd-hideOnClickOutside" title="${set_cargo_qty_tooltip}">Fijar cantidad por cada tipo nave</span>
                                </td>
                                <td class="ncsp_checkbox">
                                    <input id="ncsp_checkbox_qty" type="checkbox" value="" ${( settings.fixed_qty_checkbox ? "checked" : "" )}>
                                </td>
                            </tr>
                            <tr class="ncsp-cargo-qty-input" style="${( settings.fixed_qty_checkbox ? "" : "display:none;" )}">
                                <td class="ncsp_label">
                                    <span>
                                        Naves de Carga Pequeña (NCP)
                                    </span>
                                </td>
                                <td class="ncsp_input">
                                    <input name="ncp_qty" type="text" value="${settings.ncp_qty}">
                                </td>
                            </tr>
                            <tr class="alt ncsp-cargo-qty-input" style="${( settings.fixed_qty_checkbox ? "" : "display:none;" )}">
                                <td class="ncsp_label">
                                    <span>
                                        Naves de Carga Grande (NCG)
                                    </span>
                                </td>
                                <td class="ncsp_input">
                                    <input name="ncg_qty" type="text" value="${settings.ncg_qty}">
                                </td>
                            </tr>
                            <tr class="ncsp-cargo-qty-input" style="${( settings.fixed_qty_checkbox ? "" : "display:none;" )}">
                                <td class="ncsp_label">
                                    <span>
                                        Recicladores (REC)
                                    </span>
                                </td>
                                <td class="ncsp_input">
                                    <input name="rec_qty" type="text" value="${settings.rec_qty}">
                                </td>
                            </tr>
                            <tr class="alt ncsp-cargo-qty-input" style="${( settings.fixed_qty_checkbox ? "" : "display:none;" )}">
                                <td class="ncsp_label">
                                    <span>
                                        Exploradores (PF)
                                    </span>
                                </td>
                                <td class="ncsp_input">
                                    <input name="pf_qty" type="text" value="${settings.pf_qty}">
                                </td>
                            </tr>
                            <tr>
                                <td class="ncsp_label">
                                    <span class="ncsp_cursor_help tooltipHTML tpd-hideOnClickOutside" title="${fleet_per_planet_tooltip}">
                                        Mostrar flota por planeta
                                    </span>
                                </td>
                                <td class="ncsp_checkbox">
                                    <input id="fleet_per_planet" name="fleet_per_planet" type="checkbox" ${settings.fleet_per_planet ? "checked" : ""}>
                                </td>
                            </tr>
                            <tr class="alt">
                                <td class="ncsp_label">
                                    <span class="ncsp_cursor_help tooltipHTML tpd-hideOnClickOutside" title="${fleet_per_galaxy_tooltip}">
                                        Mostrar flota por galaxia
                                    </span>
                                </td>
                                <td class="ncsp_checkbox">
                                    <input id="fleet_per_galaxy" name="fleet_per_galaxy" type="checkbox" ${settings.fleet_per_galaxy ? "checked" : ""}>
                                </td>
                            </tr>
                            <tr>
                                <td class="ncsp_label">
                                    <span class="ncsp_cursor_help tooltipHTML tpd-hideOnClickOutside" title="${full_fleet_tooltip}">
                                        Mostrar flota completa
                                    </span>
                                </td>
                                <td class="ncsp_checkbox">
                                    <input id="full_fleet" name="full_fleet" type="checkbox" ${settings.full_fleet ? "checked" : ""}>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table cellspacing="0" cellpadding="0" class="last">
                        <tbody>
                            <tr>
                                <td style="text-align:center;">
                                    <a id="ncsp_btn_cancel" class="btn_blue ncsp_menu_button" href="#" style="color: inherit;">Cancelar</a>
                                </td>
                                <td style="text-align:center;">
                                    <a id="ncsp_btn_save" class="btn_blue ncsp_menu_button" href="#" style="color: inherit;">Guardar</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="ncsp_footer"></div>
        </div>
    `);

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

    function getInfo(type) {
        /*Load settings*/
        var settings = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config );

        var pattern_match=/\">(.*?)<\/span/gi;
        var box_content = $(`#${type}_box`).attr("title").match(pattern_match);
        box_content[0] = $(`#resources_${type}`).html();

        for(i in box_content)
            box_content[i] = parseInt(box_content[i].replace(/[^0-9]+/g, ''));

        if( (settings.time!=null && settings.time!="" && typeof settings.time!=="undefined") && !settings.fixed_qty_checkbox ) {
            /* backup original value per hour */
            var res_hour = box_content[2];

            /* get resources produced per minute in an hour */
            var res_minute = res_hour / 60;

            /* get resources produced per time given in function call */
            var res_time = res_minute * parseInt(settings.time);

            /* assign new val */
            box_content[2] = res_time;
        }

        return box_content;
    }

    function sortObjectByKeys(o) {
        return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
    }

    function simulateMouseClick (selector) {
        function eventFire (el, etype) {
            if (el.fireEvent)
            {
                el.fireEvent ('on' + etype);
                el [etype] ();
            }
            else
            {
                var evObj = document.createEvent ('Events');
                evObj.initEvent (etype, true, false);
                el.dispatchEvent (evObj);
            }
        }
        for (var i = 0; i < selector.length; i++)
            eventFire (selector [i], "click");
    }
})();
