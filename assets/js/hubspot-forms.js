(function () {
  "use strict";

  var LEAD_EVENTS_BY_FORM_ID = {
    "4a432a7b-16c2-4734-8a20-3c2b4af74246": { method: "implementation_guide", funnelLevel: "middle" },
    "62895e64-92ee-49af-9cf0-8a491fc47e1f": { method: "manufacturing_workflow", funnelLevel: "middle" },
    "f80f4546-168f-478a-83e3-d8515921d53a": { method: "spreadsheet_readiness_checklist", funnelLevel: "middle" },
    "35b77591-64ce-417f-9ce9-2c0e5af30419": { method: "erp_warning_signs", funnelLevel: "middle" },
    "072de23b-0398-4bb2-85b6-c88115fe276b": { method: "demo_request", funnelLevel: "bottom" },
    "efc11f49-51aa-4312-bbef-4945ae45aeae": { method: "strategy_call", funnelLevel: "bottom" },
    "63ddf8b0-3b4f-49a7-8ed2-d457c2f07ace": { method: "newsletter_signup", funnelLevel: "top" }
  };

  function trackLead(form, complete) {
    var definition = LEAD_EVENTS_BY_FORM_ID[form.dataset.formId];
    if (!definition || typeof window.gtag !== "function") {
      complete();
      return;
    }

    var completed = false;
    var timeoutId;

    function completeOnce() {
      if (completed) return;
      completed = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      complete();
    }

    timeoutId = window.setTimeout(completeOnce, 1000);

    window.gtag("event", "generate_lead", {
      method: definition.method,
      lead_source: "website_form",
      funnel_level: definition.funnelLevel,
      form_id: form.dataset.formId,
      event_callback: completeOnce
    });
  }

  function getCookie(name) {
    var prefix = name + "=";
    var cookies = document.cookie ? document.cookie.split(";") : [];

    for (var index = 0; index < cookies.length; index += 1) {
      var cookie = cookies[index].trim();
      if (cookie.indexOf(prefix) === 0) return decodeURIComponent(cookie.slice(prefix.length));
    }

    return "";
  }

  function setSubmitting(form, submitting) {
    var button = form.querySelector("button[type='submit']");
    if (!button) return;

    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = submitting;
    button.textContent = submitting ? "Sending…" : button.dataset.defaultText;
  }

  function setStatus(form, message, type) {
    var status = form.querySelector(".fraction-form-status");
    if (!status) return;

    status.textContent = message;
    status.className = "fraction-form-status" + (type ? " is-" + type : "");
  }

  function buildFields(form) {
    var fields = [];
    var data = new FormData(form);

    data.forEach(function (value, name) {
      if (name === "website" || value === "") return;
      fields.push({ name: name, value: String(value) });
    });

    return fields;
  }

  function updatePhoneRequirement(form) {
    var phone = form.querySelector("input[name='phone']");
    var preference = form.querySelector("input[name='preferred_contact_method']:checked");
    var requirement = form.querySelector(".fraction-phone-requirement");
    if (!phone || !preference) return;

    var required = preference.value === "Telephone";
    phone.required = required;
    phone.setAttribute("aria-required", required ? "true" : "false");
    if (requirement) requirement.textContent = required ? "(required for telephone contact)" : "(optional)";
  }

  function completeSubmission(form) {
    var redirectUrl = form.dataset.redirectUrl;
    if (redirectUrl) {
      window.location.assign(redirectUrl);
      return;
    }

    var successMessage = form.dataset.successMessage || "Thanks — your details have been received.";
    form.reset();
    updatePhoneRequirement(form);
    setStatus(form, successMessage, "success");
    setSubmitting(form, false);
  }

  async function submitForm(form) {
    var portalId = form.dataset.portalId;
    var formId = form.dataset.formId;
    var endpoint = "https://api.hsforms.com/submissions/v3/integration/submit/" + encodeURIComponent(portalId) + "/" + encodeURIComponent(formId);
    var context = {
      pageUri: window.location.href,
      pageName: document.title
    };
    var hutk = getCookie("hubspotutk");
    if (hutk) context.hutk = hutk;

    var response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submittedAt: String(Date.now()),
        fields: buildFields(form),
        context: context
      })
    });

    var responseBody = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      var error = new Error(responseBody.message || "HubSpot rejected the form submission.");
      error.response = responseBody;
      throw error;
    }
  }

  function initialiseForm(form) {
    var preferences = form.querySelectorAll("input[name='preferred_contact_method']");
    preferences.forEach(function (preference) {
      preference.addEventListener("change", function () { updatePhoneRequirement(form); });
    });
    updatePhoneRequirement(form);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setStatus(form, "", "");

      if (form.querySelector("input[name='website']").value) {
        completeSubmission(form);
        return;
      }

      setSubmitting(form, true);
      submitForm(form)
        .then(function () {
          trackLead(form, function () { completeSubmission(form); });
        })
        .catch(function (error) {
          console.error("HubSpot form submission failed", error);
          setStatus(form, "Sorry, we could not submit the form. Please check your details and try again.", "error");
          setSubmitting(form, false);
        });
    });
  }

  function initialiseForms() {
    document.querySelectorAll("[data-hubspot-api-form]").forEach(initialiseForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseForms);
  } else {
    initialiseForms();
  }
})();
