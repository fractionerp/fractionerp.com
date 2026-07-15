(function () {
  "use strict";

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
    if (!phone || !preference) return;

    var required = preference.value === "Telephone";
    phone.required = required;
    phone.setAttribute("aria-required", required ? "true" : "false");
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
        .then(function () { completeSubmission(form); })
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
