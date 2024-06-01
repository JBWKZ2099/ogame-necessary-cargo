// ==UserScript==
// @name         OGame Redesign: Necessary cargo ships
// @namespace    necessary_cargo
// @version      1.10.2
// @description  Displays necessary cargo ships to move / transport the resources
// @author       JBWKZ2099
// @homepageURL  https://github.com/JBWKZ2099/ogame-necessary-cargo
// @updateURL    https://raw.githubusercontent.com/JBWKZ2099/ogame-necessary-cargo/master/dist/user.remaining_fields.js
// @downloadURL  https://raw.githubusercontent.com/JBWKZ2099/ogame-necessary-cargo/master/dist/user.remaining_fields.js
// @supportURL   https://github.com/JBWKZ2099/ogame-necessary-cargo/issues
// @match        *://*.ogame.gameforge.com/game/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    var theHref = location.href,
        uni = "s"+(/s(\d+)-(\w+)/.exec(window.location.href)[1]),
        lang = /s(\d+)-(\w+)/.exec(window.location.href)[2],
        api_url = `https://${uni}-${lang}.ogame.gameforge.com/api`,
        researchHref = theHref.split("/game")[0]+"/game/index.php?page=ingame&component=research",
        _localstorage_varname = `__LS_${uni}_${lang}_necessaryCargo`,
        _localstorage_research = `UV_playerResearch`,
        _LS_val = {},
        ogame_version = parseVersion( $(`meta[name="ogame-version"]`).attr("content") ),
        unsafe = window;

    // localStorage.removeItem(_localstorage_varname);

    try {
        unsafe = unsafeWindow;
    } catch(e) {}

    var max_cargos = calcExpesCargos(); /*Se calcula la cantidad máxima de cargueras grandes y/o pequeñas para ser enviadas en las expes*/
    var settings = null;

    if( typeof localStorage.getItem(_localstorage_varname)=="undefined" || localStorage.getItem(_localstorage_varname)==null ) {
        var conf = {},
            settings = {},
            expes_ships = {};

        expes_ships[202] = max_cargos.max_sc;  /*NPC*/
        expes_ships[203] = max_cargos.max_lc;  /*NGC*/
        expes_ships[204] = 0;   /*Lig*/
        expes_ships[205] = 0;   /*Pes*/
        expes_ships[206] = 0;   /*Cru*/
        expes_ships[207] = 0;   /*Nb*/
        expes_ships[208] = 0;
        expes_ships[209] = 0;
        expes_ships[210] = 1;  /*Son*/
        expes_ships[211] = 0;   /*Des*/
        expes_ships[213] = 0;   /*Aco*/
        expes_ships[214] = 0;
        expes_ships[215] = 0;   /*Bb*/
        expes_ships[218] = 1;   /*RR*/
        expes_ships[219] = 1;   /*PF*/

        conf["expes_ss"] = true;
        conf["expes_ships"] = expes_ships;
        conf["time"] = "60";
        conf["fixed_qty_checkbox"] = false;
        conf["fleet_per_planet"] = true;
        conf["fleet_per_galaxy"] = true;
        conf["full_fleet"] = true;
        conf["ship_cargo"] = false;
        conf["ncp_qty"] = "0";
        conf["ncg_qty"] = "0";
        conf["rec_qty"] = "0";
        conf["pf_qty"] = "0";

        settings["config"] = JSON.stringify(conf);
        localStorage.setItem(_localstorage_varname, JSON.stringify(settings));
    }

    // debugger;

    /*Check if tech data is on localStorage*/
    if( typeof localStorage.getItem(_localstorage_research)==="undefined" || localStorage.getItem(_localstorage_research)==null ) {
        /*Redirect to research page*/
        if( theHref.indexOf("research")==-1 ) {
            var researchHref = theHref.split("/game")[0]+"/game/index.php?page=ingame&component=research";
            localStorage._previousURL_necessaryCargo = theHref;
            window.location.href = researchHref;
        } else {
            localStorage.setItem(_localstorage_research, "");
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

            localStorage.setItem(_localstorage_research, researches);
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
            researches = JSON.parse( localStorage.getItem(_localstorage_research) ),
            hyperspace = researches[114],
            fighterLight_base = 50,
            fighterHeavy_base = 100,
            cruiser_base = 800,
            battleship_base = 1500,
            interceptor_base = 750,
            bomber_base = 500,
            destroyer_base = 2000,
            deathstar_base = 1000000,
            reaper_base = 10000,
            pf_base = 10000,
            ncp_base = 5000,
            ncg_base = 25000,
            colonyShip_base = 7500,
            rec_base = 20000,
            espionageProbe_base = 0,
            fighterLight = 0,
            fighterHeavy = 0,
            cruiser = 0,
            battleship = 0,
            interceptor = 0,
            bomber = 0,
            destroyer = 0,
            deathstar = 0,
            reaper = 0,
            pf = 0,
            ncp = 0,
            ncg = 0,
            colonyShip = 0,
            rec = 0,
            espionageProbe = 0,
            bonus_class_rec = 0,
            bonus_class_pf = 0,
            bonus_class = 0,
            player_class = $("#characterclass div.characterclass"),
            bonus_research = (hyperspace*5)/100,
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

                .ncs-config, .ncs-reload {
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

                span.ncs-reload { right: 19px !important; }
                span.ncs-reload span { transform: scale(0.8) !important; }

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

                .tbl-necesary-cargo tbody > tr[style]:hover { opacity: 0.6 !important; }
                .tbl-necesary-cargo tbody > tr:not([style]):hover,
                .tbl-necesary-cargo tbody > tr.current[style]:hover,
                .tbl-necesary-cargo tbody > tr.current > td > .ncs-setup-ship:hover { opacity: 1 !important; }
                .tbl-necesary-cargo tbody > tr.current > td > .ncs-setup-ship[style] { color: #2FE000; }

                .tbl-necesary-cargo tbody > tr:hover > td,
                .tbl-necesary-cargo tbody > tr.current > td,
                .tbl-necesary-cargo tbody > tr[data-current].hover > td {
                    color: #2FE000;
                    background-color: #182028;
                }

                .ncs-open-jumpgate { cursor: pointer; }

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

                .ncs-cargo-capacity {
                    position: absolute;
                    bottom: 15px;
                    font-size: 10px;
                    background: rgba(0,0,0,0.65);
                    right: 0;
                    left: unset;
                    padding: 1px 3px;
                    pointer-events: none;
                }
            `;

        if( ogame_version[0]>8 ) {
            css += `
                .necesary-cargo {
                    top: 0 !important;
                }
            `;
        }

        if( player_class.hasClass("miner") )
            bonus_class = 0.25;

        if( player_class.hasClass("warrior") ) {
            bonus_class_pf = 0.20;
            bonus_class_pf = pf_base*bonus_class_pf;
            bonus_class_rec = pf_base*bonus_class_rec;
        }

        ncp = (ncp_base*bonus_class + ncp_base*bonus_research) + ncp_base;
        ncg = (ncg_base*bonus_class + ncg_base*bonus_research) + ncg_base;
        rec = (bonus_class_rec + rec_base*bonus_research) + rec_base;
        pf = (bonus_class_pf + pf_base*bonus_research) + pf_base;

        fighterLight = (fighterLight_base*bonus_research) + fighterLight_base;
        fighterHeavy = (fighterHeavy_base*bonus_research) + fighterHeavy_base;
        cruiser = (cruiser_base*bonus_research) + cruiser_base;
        battleship = (battleship_base*bonus_research) + battleship_base;
        interceptor = (interceptor_base*bonus_research) + interceptor_base;
        bomber = (bomber_base*bonus_research) + bomber_base;
        destroyer = (destroyer_base*bonus_research) + destroyer_base;
        deathstar = (deathstar_base*bonus_research) + deathstar_base;
        reaper = (reaper_base*bonus_research) + reaper_base;
        colonyShip = (colonyShip_base*bonus_research) + colonyShip_base;
        espionageProbe = (espionageProbe_base*bonus_research) + espionageProbe_base;

        /* If fixed qty is setted, then resources produced in an hour will not be considered, just the current production */
        settings = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config );
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

                <span id="ncs-reload" class="ncs-reload tooltipLeft tpd-hideOnClickOutside" data-title="Resetear ajustes">
                    <span class="icon icon_restore js_actionRevive"></span>
                </span>
                <span id="ncs-config" class="ncs-config tooltipRight" data-title="Ajustes">
                    <img src="https://gf3.geo.gfsrv.net/cdne7/1f57d944fff38ee51d49c027f574ef.gif" width="16" height="16">
                </span>
            </div>
        `);
    }

    if( localStorage.getItem(_localstorage_varname) )
        settings = JSON.parse(localStorage.getItem(_localstorage_varname));

    if( settings===undefined || settings==null || settings=="" ) {
        var conf = {},
            settings = {},
            expes_ships = {};

        expes_ships[202] = max_cargos.max_sc;  /*NPC*/
        expes_ships[203] = max_cargos.max_lc;  /*NGC*/
        expes_ships[204] = 0;   /*Lig*/
        expes_ships[205] = 0;   /*Pes*/
        expes_ships[206] = 0;   /*Cru*/
        expes_ships[207] = 0;   /*Nb*/
        expes_ships[208] = 0;
        expes_ships[209] = 0;
        expes_ships[210] = 1;  /*Son*/
        expes_ships[211] = 0;   /*Des*/
        expes_ships[213] = 0;   /*Aco*/
        expes_ships[214] = 0;
        expes_ships[215] = 0;   /*Bb*/
        expes_ships[218] = 1;   /*RR*/
        expes_ships[219] = 1;   /*PF*/

        conf["expes_ss"] = true;
        conf["expes_ships"] = expes_ships;
        conf["time"] = "60";
        conf["fixed_qty_checkbox"] = false;
        conf["fleet_per_planet"] = true;
        conf["fleet_per_galaxy"] = true;
        conf["full_fleet"] = true;
        conf["ship_cargo"] = false;
        conf["ncp_qty"] = "0";
        conf["ncg_qty"] = "0";
        conf["rec_qty"] = "0";
        conf["pf_qty"] = "0";

        settings["config"] = JSON.stringify(conf);
        localStorage.setItem(_localstorage_varname, JSON.stringify(settings));
    }

    settings = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config );
    settings.expes_ships[202] = max_cargos.max_sc;
    settings.expes_ships[203] = max_cargos.max_lc;

    $(document).on("click", "#ncs-config", function(e){
        e.preventDefault();
        var main_content_div = "#middle .maincontent > div";

        if( theHref.indexOf("/game/index.php?page=ingame&component=fleetdispatch")>-1 ) {
            main_content_div = `#middle .maincontent > div#fleet1`;
        }

        if( !$(document).find("#ncsp_window").is(":visible") ) {
            $(main_content_div).hide();
            $(".maincontent").css({"z-index": "10"});
            $(this).addClass("selected");
        } else {
            $(".maincontent").removeAttr("style");
            $(main_content_div).show();
            $(this).removeClass("selected");
        }
        appendNCSPanel(settings);
    });

    $(document).on("click", "#ncs-reload", function(e){
        localStorage.removeItem(_localstorage_research);
        localStorage.removeItem(_localstorage_varname);

        /*localStorage.removeItem("UV_playerResearch");
        localStorage.removeItem("__LS_s130_mx_necessaryCargo");*/

        $(document).find(".necesary-cargo").append(`<div class="ncsp-msg-reset">¡Se reiniciaron los ajustes!</div>`);

        setTimeout(function(){
            $(document).find(".ncsp-msg-reset").remove();
            window.location.reload();
        }, 2500);
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
            full_fleet = $(document).find("#full_fleet").prop("checked") ? true : false,
            ship_cargo = $(document).find("#ship_cargo").prop("checked") ? true : false;

        if( fixed_qty_checkbox ) {
            ncp_qty = $(`input[name="ncp_qty"]`).val();
            ncg_qty = $(`input[name="ncg_qty"]`).val();
            rec_qty = $(`input[name="rec_qty"]`).val();
            pf_qty = $(`input[name="pf_qty"]`).val();
        }

        var expes_ss = $(document).find("#ncsp_checkbox_expes_ss").prop("checked");
        if( expes_ss===false )
            expes_ss = parseInt( $(document).find("#ncsp_input_expes_ss").val() );

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
        settings.ship_cargo = ship_cargo;
        settings.expes_ss = expes_ss;

        new_settings["config"] = JSON.stringify(settings);
        localStorage.setItem(_localstorage_varname, JSON.stringify(new_settings));

        $(document).find("#ncsp_close").click();

        $(document).find(".necesary-cargo").append(`<div class="ncsp-msg-saved">¡Guardado!</div>`);

        setTimeout(function(){
            $(document).find(".ncsp-msg-saved").remove();
            window.location.reload();
        }, 2500);
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
            appendNCSPanel(settings);
        }
    });

    $(document).on("focus", ".ncsp_ship_selection_table .ship_input_row.shipValue > input", function(){
        $(this).attr("data-old-value", $(this).val());
        clearInput(this);
    });

    $(document).on("blur", ".ncsp_ship_selection_table .ship_input_row.shipValue > input", function(){
        $(this).val( $(this).attr("data-old-value") );
    });

    $(document).on("keyup", ".ncsp_ship_selection_table .ship_input_row.shipValue > input", function(){
        $(this).attr("data-old-value", $(this).val());
    });

    $(document).on("click", ".ncsp-accordion-trigger", function(e){
        e.preventDefault();
        if( !$(this).hasClass("active") ) {
            $(".ncsp-accordion-trigger").removeClass("active");
            $(".ncsp-accordion.active").removeClass("active").slideUp(100);

            $(this).addClass("active")
            $(this).next().addClass("active").slideDown(100);
        }
    });

    $(document).on("change", "#ncsp_checkbox_expes_ss", function(e){
        var expes_chkbx = $(this).prop("checked");

        if( expes_chkbx===false ) {
            var current_ss = ($(document).find(`meta[name="ogame-planet-coordinates"]`).attr("content")).split(":")[1];
            $(document).find("#ncsp_input_expes_ss_container").show();
            $(document).find("#ncsp_input_expes_ss").val( parseInt(current_ss) );
        } else {
            $(document).find("#ncsp_input_expes_ss_container").hide();
            $(document).find("#ncsp_input_expes_ss").val( parseInt(0) );
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

            myPlanetList[planetKoords]["sent"] = "unset";

            current_settings["planetList"] = myPlanetList;
            new_pl_sett["config"] = JSON.stringify(current_settings);
            localStorage.setItem(_localstorage_varname, JSON.stringify(new_pl_sett));
        }

        if( theHref.indexOf("/game/index.php?page=ingame&component=fleetdispatch")>-1 ) {
            if( current_settings.fleet_per_planet===true || current_settings.fleet_per_galaxy===true || current_settings.full_fleet===true ) {
                var count_sub_npc = 0,
                    count_sub_ngc = 0,
                    count_sub_rec = 0,
                    count_sub_pf = 0,
                    count_tot_npc = 0,
                    count_tot_ngc = 0,
                    count_tot_rec = 0,
                    count_tot_pf = 0,
                    galaxies = [],
                    planets = getElementsByClass("smallplanet"),
                    numPlanets = planets.length,
                    listaPlanetas = "",
                    planet_deletes = 0;

                for (var i=0; i<planets.length; i++ ) {
                    var cord = getElementsByClass("planet-koords", planets[i]),
                        nombre = getElementsByClass("planet-name", planets[i]);

                    listaPlanetas += cord[0].innerHTML + ";";
                }

                listaPlanetas = listaPlanetas.slice(0, -1).split(";");

                /*Buscamos si los planetas existentes están en el objeto de configuración*/
                    if( numPlanets>0 && Object.keys(settings.planetList).length>0 ) {
                        var planet_list_config = [],
                            i=0,
                            _index;

                        /*Se crea un array adicional para guardar únicamente las coordenadas de los planetas*/
                        for( i=0; i<=Object.keys(settings.planetList).length; i++ )
                            planet_list_config.push( Object.keys(settings.planetList)[i] );

                        /*Se identifican las coordenadas de planetas que no están en la cuenta*/
                        for( i=0; i<=listaPlanetas.length; i++ ) {
                            _index = planet_list_config.indexOf(listaPlanetas[i]);
                            if( _index>-1 )
                                planet_list_config.splice(_index, 1);
                        }

                        /*Se eliminan coordenadas de los planetas que no están en la cuenta*/
                        for( i=0; i<=planet_list_config.length; i++ ) {
                            delete settings.planetList[ planet_list_config[i] ];
                            planet_deletes++;
                        }

                        /*Guardamos en caso de que hayan habido eliminaciones*/
                        if( planet_deletes>0 ) {
                            var new_sett = {}
                            new_sett["config"] = JSON.stringify(settings);
                            localStorage.setItem(_localstorage_varname, JSON.stringify(new_sett));
                        }
                    }
                /**/

                var plist = null;
                var plist = JSON.parse( JSON.parse(localStorage.getItem(_localstorage_varname)).config ).planetList;
                plist = sortObjectByKeys(plist);

                var table_plist = `
                    <div class="ncs-text-center" style="margin-top:15px;">
                        <a href="#" class="btn_blue set-expedition-config" data-ship="202" style="color:#FFF !important;margin-right:5px;">
                            Expes NPC
                        </a>

                        <a href="#" class="btn_blue set-expedition-config" data-ship="203" style="color:#FFF !important;">
                            Expes NGC
                        </a>
                    </div>

                    <table class="tbl-necesary-cargo tbl-ncsp-planets" style="${(current_settings.fleet_per_planet ? "" : "display:none;" )}">
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
                                <th class="ncs-text-center ncs-text-blue tbl-th-pf">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>`;

                $.each(plist, function(i, el) {
                    var galaxy = (i.split("[")[1]).split(":")[0];
                    galaxies.push(galaxy);

                    table_plist += `
                        <tr class="${( i==planetKoords || i==_moonKoords ? "current" : "" )}${( el.sent!="unset" ? " sent" : "" )}" ${( i==planetKoords || i==_moonKoords ? "data-current" : "" )}>
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
                            <td class="ncs-text-center">
                                <button class="icon icon_trash remove-ncs-item"></button>
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
                });

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
                                        <span class="ncs-open-jumpgate" data-ship="202" data-qty="${e.sub_npc}" style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_npc} |
                                        </span>
                                        <span class="ncs-open-jumpgate" data-ship="202" data-qty="${e.tot_npc}">
                                            ${e.tot_npc}
                                        </span>
                                    </td>
                                    <td class="ncs-text-center">
                                        <span class="ncs-open-jumpgate" data-ship="203" data-qty="${e.sub_ngc}" style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_ngc} |
                                        </span>
                                        <span class="ncs-open-jumpgate" data-ship="203" data-qty="${e.tot_ngc}">
                                            ${e.tot_ngc}
                                        </span>
                                    </td>
                                    <td class="ncs-text-center">
                                        <span class="ncs-open-jumpgate" data-ship="209" data-qty="${e.sub_rec}" style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_rec} |
                                        </span>
                                        <span class="ncs-open-jumpgate" data-ship="209" data-qty="${e.tot_rec}">
                                            ${e.tot_rec}
                                        </span>
                                    </td>
                                    <td class="ncs-text-center">
                                        <span class="ncs-open-jumpgate" data-ship="219" data-qty="${e.sub_pf}" style="${(!settings.full_fleet ? "display:none;" : "")}">
                                            ${e.sub_pf} |
                                        </span>
                                        <span class="ncs-open-jumpgate" data-ship="219" data-qty="${e.tot_pf}">
                                            ${e.tot_pf}
                                        </span>
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

            if( current_settings.ship_cargo===true ) {
                $(`#technologies ul li[data-technology="204"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(fighterLight))}</span>
                `);
                $(`#technologies ul li[data-technology="205"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(fighterHeavy))}</span>
                `);
                $(`#technologies ul li[data-technology="206"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(cruiser))}</span>
                `);
                $(`#technologies ul li[data-technology="207"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(battleship))}</span>
                `);
                $(`#technologies ul li[data-technology="215"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(interceptor))}</span>
                `);
                $(`#technologies ul li[data-technology="211"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(bomber))}</span>
                `);
                $(`#technologies ul li[data-technology="213"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(destroyer))}</span>
                `);
                $(`#technologies ul li[data-technology="214"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(deathstar))}</span>
                `);
                $(`#technologies ul li[data-technology="218"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(reaper))}</span>
                `);
                $(`#technologies ul li[data-technology="219"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(pf))}</span>
                `);
                $(`#technologies ul li[data-technology="202"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(ncp))}</span>
                `);
                $(`#technologies ul li[data-technology="203"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(ncg))}</span>
                `);
                $(`#technologies ul li[data-technology="208"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(colonyShip))}</span>
                `);
                $(`#technologies ul li[data-technology="209"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(rec))}</span>
                `);
                $(`#technologies ul li[data-technology="210"] > span.sprite`).append(`
                    <span class="ncs-cargo-capacity">${addDots(Math.floor(espionageProbe))}</span>
                `);
            }
        }

        $(document).on("click", ".set-expedition-config", function(e){
            var which_ship = $(this).attr("data-ship"),
                expes_ships = settings.expes_ships;

            $("#position").val(16).keyup();
            simulateMouseClick( $("#missionButton15") );
            $("#resetall").click();

            $(document).find(`li.technology[data-technology="${which_ship}"][data-status="on"] > input`).focus().val(expes_ships[which_ship]);
            $(document).find(`li.technology[data-technology="210"][data-status="on"] > input`).focus().val(expes_ships[210]); /*Son*/
            $(document).find(`li.technology[data-technology="218"][data-status="on"] > input`).focus().val(expes_ships[218]); /*RR*/
            $(document).find(`li.technology[data-technology="219"][data-status="on"] > input`).focus().val(expes_ships[219]); /*PF*/
            $("#continueToFleet2").focus();

            /*OGame Infinity*/
            if( $(document).find(".ogl-harvestOptions").length>0 ) {
                $(".ogl-coords #positionInput").val(16).keyup();
            }

            if( typeof settings.expes_ss!="boolean" ) {
                if( $(document).find(".ogl-harvestOptions").length>0 )
                    $(".ogl-coords #systemInput").val( settings.expes_ss ).keyup();
                else
                    $("#system").val( settings.expes_ss ).keyup();
            }

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
            var _val = $(this).attr("data-val"),
                _type = $(this).attr("data-type"),
                $_this_parent = $(this).parent().parent();

            $(document).find(".tbl-necesary-cargo.tbl-ncsp-planets tr").removeClass("ncs-setup-ready");
            $_this_parent.addClass("ncs-setup-ready");

            if( $(this).attr("class").indexOf("btn-sub")>-1 )
                $_this_parent = $(this).parent().parent().parent();

            var coords = (($_this_parent.find(".ncs-koords").text()).split("[")[1]).split("]")[0];
            var selected = $(this).parent().parent().find(".ncs-koords .selected");

            /*Se quita opacidad en los elementos que no están seleccionados para resaltar la opción seleccionada*/
                $(document).find(".tbl-necesary-cargo.tbl-ncsp-planets tbody tr").css("opacity", "0.3");
                $(document).find(".tbl-necesary-cargo.tbl-ncsp-planets tbody tr.current").addClass("hover");
                $(document).find(".tbl-necesary-cargo.tbl-ncsp-planets tbody tr").removeClass("current");

                $_this_parent.css("opacity", "1");
                $_this_parent.addClass("current");
            /*Se quita opacidad en los elementos que no están seleccionados para resaltar la opción seleccionada*/

            /*Se quita opacidad en las cantidades de flota que no fuern seleccionados*/
                $(document).find(".tbl-necesary-cargo.tbl-ncsp-planets tbody tr.current td:not(.ncs-koords) .ncs-setup-ship").css("opacity", "0.45");
                $(this).css("opacity", "1");
            /*Se quita opacidad en las cantidades de flota que no fuern seleccionados*/

            $(document).find(`li.technology > input`).val("").keyup();
            $(document).find(`li.technology[data-technology=${_type}][data-status="on"] > input`).focus().val(_val);
            $(document).find("#continueToFleet2").focus();

            var selected_target = selected.hasClass("moon") ? "moon" : "name";

            /*Antigame*/
            if( $(document).find("#ago_shortcuts").length>0 ) {
                simulateMouseClick( $(document).find(`.ago_shortcuts_own a[rel="${coords}"] .ago_shortcuts_${selected_target}`) );

                $("#missionButton4").trigger("click");
                return;
            }

            var targets = {};
            targets["galaxy"] = "#galaxy";
            targets["system"] = "#system";
            targets["position"] = "#position";
            targets["moon"] = "#mbutton";
            targets["planet"] = "#pbutton";

            /*OGame Infinity*/
            if( $(document).find(".ogl-harvestOptions").length>0 ) {
                targets["galaxy"] = ".ogl-coords #galaxyInput";
                targets["system"] = ".ogl-coords #systemInput";
                targets["position"] = ".ogl-coords #positionInput";
                targets["moon"] = ".ogl-moon-icon";
                targets["planet"] = ".ogl-planet-icon";
            }
            var coords_split = ((coords.replace(/[\[\]]/g, "")).trim()).split(":");

            $(targets.galaxy).val(coords_split[0]).keyup();
            $(targets.system).val(coords_split[1]).keyup();
            $(targets.position).val(coords_split[2]).keyup();

            if( selected_target=="moon" )
                simulateMouseClick($(targets.moon));
            else
                simulateMouseClick($(targets.planet));

            $("#missionButton4").trigger("click");
        });

        $(document).on("click", ".ncs-open-jumpgate", function(e){
            var $this = $(this);
            window.location = "javascript:openJumpgate()";

            setTimeout(function(){
                var ship = $this.attr("data-ship");
                var qty = $this.attr("data-qty");

                toggleMaxShips('#jumpgateForm', ship, qty);
            }, 1000);
        });

        $(document).on("click", ".ncs-koords > span", function(e){
            e.preventDefault();

            $(this).parent().find("span").removeClass("selected");
            $(this).addClass("selected");
        });

        $(document).on("click", "#sendFleet, #dispatchFleet", function(e){
            var ready = $(document).find(".tbl-necesary-cargo.tbl-ncsp-planets tr.ncs-setup-ready").length==1;

            if( ready ) {
                var koords = $(document).find(".tbl-necesary-cargo.tbl-ncsp-planets .current .ncs-koords").text().trim();
                var new_sett = {};
                settings.planetList[koords].sent = "ok";
                new_sett["config"] = JSON.stringify(settings);
                localStorage.setItem(_localstorage_varname, JSON.stringify(new_sett));
            }
        });

        $(document).on("click", ".remove-ncs-item", function(e){
            e.preventDefault();

            var koords = $(this).parent().parent().find(".ncs-koords").text().trim();
            var new_sett = {};

            delete settings.planetList[koords];
            new_sett["config"] = JSON.stringify(settings);
            localStorage.setItem(_localstorage_varname, JSON.stringify(new_sett));

            $(this).parent().parent().remove();
        });
    /*Funcionalidad para almacenar la cantidad de naves necesarias en cada planeta*/

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
        var box_content = $(`#${type}_box`).attr("data-tooltip-title").match(pattern_match);
        box_content[0] = $(`#resources_${type}`).attr("data-raw");

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

    function getElementsByClass(searchClass,node,tag) {
        var classElements = new Array();
        if (node == null)
            node = document;
        if (tag == null)
            tag = '*';
        var els = node.getElementsByTagName(tag);
        var elsLen = els.length;

        for (var i = 0, j = 0; i < elsLen; i++) {
            var sep = els[i].className.split(" ");
            var content = false;

            for(var k = 0; k < sep.length; k++){
                if(sep[k] == searchClass)
                    content = true;
            }

            if (els[i].className == searchClass || content) {
                classElements[j] = els[i];
                j++;
            }
        }
        return classElements;
    }

    function calcExpesCargos() {
        var explorer = $("#characterclass .characterclass").hasClass("explorer"),
            miner = $("#characterclass .characterclass").hasClass("miner"),
            highscore_url = `${api_url}/highscore.xml?category=1&type=1`,
            eco_speed = parseInt($(`meta[name="ogame-universe-speed"]`).attr("content")),
            hyperspace = JSON.parse(localStorage.getItem(_localstorage_research))[114],
            top_highscore = getPlayerHighscore(highscore_url),
            max_total = 0,
            min_sc = 0,
            min_lc = 0,
            max_sc = 0,
            max_lc = 0;

        if (top_highscore < 1E4) {
            max_total = 4E4;
            min_sc = 273;
            min_lc = 91
        } else if (top_highscore < 1E5) {
            max_total = 5E5;
            min_sc = 423;
            min_lc = 141
        } else if (top_highscore < 1E6) {
            max_total = 12E5;
            min_sc = 423;
            min_lc = 191
        } else if (top_highscore < 5E6) {
            max_total = 18E5;
            min_sc = 423;
            min_lc = 191
        } else if (top_highscore < 25E6) {
            max_total = 24E5;
            min_sc = 573;
            min_lc = 191
        } else if (top_highscore < 5E7) {
            max_total = 3E6;
            min_sc = 723;
            min_lc = 241
        } else if (top_highscore < 75E6) {
            max_total = 36E5;
            min_sc = 873;
            min_lc = 291
        } else if (top_highscore < 1E8) {
            max_total = 42E5;
            min_sc = 1023;
            min_lc = 341
        } else {
            max_total = 5E6;
            min_sc = 1223;
            min_lc = 417
        }

        max_total = explorer ? max_total * 3 * eco_speed : max_total * 2;
        var lc_cap = 0.05*hyperspace*25000 + 25000,
            sc_cap = 0.05*hyperspace*5000 + 5000;

        /* if is miner class, modify the large cargo capacity */
        if( miner ) {
            lc_cap = lc_cap + (25000*0.25);
            sc_cap = sc_cap + (5000*0.25);
        }

        var _return = {};
        _return["max_sc"] = Math.ceil(max_total/sc_cap);
        _return["max_lc"] = Math.ceil(max_total/lc_cap);

        return _return;
    }

    function parseVersion(version) {
        var i,v = version.split(/\D+/g);
        for (i in v)
            v[i]=parseInt(v[i]);
        return v;
    }

    function appendNCSPanel(settings) {
        if( $("html head .ncs-style").length==0 ) {
            /* Styles for config panel */
            $("html head").append(`
                <style class="ncs-style">
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
                    #ncsp {
                        margin-top: -1px;
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
                    .ncsp-msg-reset {
                        color: #FF8D00;
                        font-weight: bold;
                        background-color: rgba(0,0,0,0.65);
                    }
                    .ncsp-no-margin { margin-bottom: 0 !important; padding-bottom: 0 !important; }
                    .ncsp_config_title {
                        font-size: 11px;
                        font-weight: bold;
                        color: #6F9FC8;
                        line-height: 22px;
                        background: url("http://gf1.geo.gfsrv.net/cdn0b/d55059f8c9bab5ebf9e8a3563f26d1.gif") no-repeat scroll 0 0 #13181D;
                        height: 22px;
                        margin: 0 0 10px 0;
                        padding: 0 0 0 40px;
                        border: 1px solid #000;
                        overflow: hidden;
                        cursor: pointer;
                    }
                    .ncsp_ship_lbl { width: 120px !important; }

                    .tbl-necesary-cargo.tbl-ncsp-planets .sent, .sent:hover { opacity: 0.3 !important; }
                    .tbl-necesary-cargo.tbl-ncsp-planets .sent td { pointer-events: none !important; }
                    .tbl-necesary-cargo.tbl-ncsp-planets .sent td:last-child { pointer-events: all !important; }
                </style>
            `);
        }

        /* HTML for config panel */
        var extra_cargo_qty_tooltip = `Adicionar tiempo|<ol><li>Se calcularán los recursos generados en el lapso de tiempo establecido para sumar la cantidad de naves extra que se deben enviar.</li><li><b>Nota:</b> El tiempo establecido debe ser en minutos. <br> <b>Es importante tener en cuenta que si se actualiza este dato, se deberán recorrer nuevamente los planetas para ajustar las cantidades en la tabla de la pantalla de flota.</b></li></ol>`,
            set_cargo_qty_tooltip = `Cantidad de naves|<ol><li>Los valores especificados en cada uno de los campos a continuación se adicionarán al total de naves; es decir, si se requieren 100 NCP y se especifican 50 en el campo correspondiente, el total de naves será ahora 150.</li><li><b>Nota:</b> El tiempo establecido se ignorará y únicamente se sumarán las cantidades de naves especificadas en los campos respectivos. <br> <b>Es importante tener en cuenta que si se actualiza este dato, se deberán recorrer nuevamente los planetas para ajustar las cantidades en la tabla de la pantalla de flota.</b></li></ol>`,
            fleet_per_planet_tooltip = `Flota por planeta|<ol><li>Se mostrará la cantidad de flota necesaria para transportar los recursos en una tabla en la pantalla de Flota.</li></ol>`,
            fleet_per_galaxy_tooltip = `Flota por galaxia|<ol><li>Se mostrará la cantidad de flota necesaria para transportar los recursos en una tabla en la pantalla de Flota. Este dato calcula la flota necesaria por galaxia para realizar el salto de las naves (Ejemplo: Si se tienen 5 planetas en G1 y la flota principal se encuentra en G3, se calculan las naves necesarias para transportar todos los recursos de G1 y realizar el salto de las naves necesarias que se encuentran en G3).</li></ol>`,
            full_fleet_tooltip = `Flota completa|<ol><li>Se mostrará la cantidad de flota con y sin las naves adicionales para los recursos generados en cierto tiempo (este dato se configura en el campo 'Adicionar Tiempo').</li></ol>`,
            ship_cargo_tooltip = `Capacidad de naves|<ol><li>Se mostrará la capacidad de carga de las naves en la vista Flota.</li></ol>`,
            expes_ss_tooltip = `eo sistema solar|<ol><li>Si se marca la opción por defecto se seleccionará la posición actual para las expediciones, de lo contrario se podrá ingresar a qué sistema solar se desea enviar la flota.</li></ol>`;

        if( $(document).find("#ncsp_window").length==0 ) {
            $("#middle .maincontent").after(`
                <div id="ncsp_window" class="dinamic-jbwkz2099" style="display:block;">
                    <div id="ncsp_header">
                        <h4>Naves necesarias para el transporte<span class="o_trade_calc_config_only"> » Configuración</span></h4>
                        <a id="ncsp_close" href="#" class="close_details close_ressources"></a>
                    </div>

                    <div id="ncsp_main">
                        <div class="ncsp_config_title ncsp-no-margin ncsp-accordion-trigger active">General</div>
                        <div id="ncsp" class="ncsp-accordion active" style="">
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
                                    <tr class="alt">
                                        <td class="ncsp_label">
                                            <span class="ncsp_cursor_help tooltipHTML tpd-hideOnClickOutside" title="${ship_cargo_tooltip}">
                                                Mostrar capacidad de carga de cada nave
                                            </span>
                                        </td>
                                        <td class="ncsp_checkbox">
                                            <input id="ship_cargo" name="ship_cargo" type="checkbox" ${settings.ship_cargo ? "checked" : ""}>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="ncsp_config_title ncsp-no-margin ncsp-accordion-trigger">Configuración expediciones</div>
                        <div id="ncsp" class="ncsp-accordion" style="display:none;">

                            <table cellspacing="0" cellpadding="0" style="margin-bottom:0 !important; margin-top:-1px;">
                                <tbody>
                                    <tr>
                                        <td class="ncsp_label">
                                            <span class="ncsp_cursor_help tooltipHTML tpd-hideOnClickOutside" title="${expes_ss_tooltip}">Mismo sistema solar</span>
                                        </td>
                                        <td class="ncsp_checkbox">
                                            <input id="ncsp_checkbox_expes_ss" type="checkbox" value="" ${( settings.expes_ss===true ? "checked" : "" )}>
                                        </td>
                                    </tr>

                                    <tr id="ncsp_input_expes_ss_container" class="alt" style="${( settings.expes_ss===true ? "display:none;" : "" )}">
                                        <td class="ncsp_label">
                                            <span>Introduzca sistema solar</span>
                                        </td>
                                        <td class="ncsp_input">
                                            <input type="text" class="textRight textinput" size="3" id="ncsp_input_expes_ss" name="ncsp_input_expes_ss" value="${( settings.expes_ss!==true ? settings.expes_ss : 0 )}" autocomplete="off" style="margin-right:13px;">
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div id="ncsp">
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
        } else {
            if( !$(document).find("#ncsp_window").is(":visible") )
                $(document).find("#ncsp_window").show()
            else
                $(document).find("#ncsp_window").hide()
        }
    }
})();

async function getPlayerHighscore(url){
    return $.get(url, ()=>{}).then((resp)=>{
        return $(resp).find("player:first-child").attr("score");
    });
}