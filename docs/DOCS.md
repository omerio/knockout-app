<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [KnockoutJS-App Documentation](#knockoutjs-app-documentation)
  - [Introduction](#introduction)
  - [Why Knockout](#why-knockout)
  - [Knockout Application Design](#knockout-application-design)
  - [Customer Admin Application](#customer-admin-application)
  - [Loading Initial Data](#loading-initial-data)
  - [Knockout Mapping Plugin](#knockout-mapping-plugin)
  - [Implementing the Customers Table](#implementing-the-customers-table)
  - [Managing UI State using Boolean View Model Flags](#managing-ui-state-using-boolean-view-model-flags)
  - [Coding Components](#coding-components)
    - [Template afterRender Function](#template-afterrender-function)
  - [Managing inline editing](#managing-inline-editing)
  - [Adding New Items](#adding-new-items)
  - [Saving Data](#saving-data)
    - [A gotcha with re-assigning observables](#a-gotcha-with-re-assigning-observables)
  - [Understanding Context (Scope)](#understanding-context-scope)
  - [Where to next?](#where-to-next)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# KnockoutJS-App Documentation

## Introduction

KnockoutJS-App is a basic functioning CRUD (Create, Read, Update & Delete) application using [Knockout](http://knockoutjs.com/). The application demonstrates the loading, rendering and saving of nested JSON data using AJAX. 

The application uses: 
* [knockout components](http://knockoutjs.com/documentation/component-overview.html) to create an encapsulated HTML component or widget, 
* [knockout-mapping plugin](http://knockoutjs.com/documentation/plugins-mapping.html) to make complex nested objects observables, 
* [Bootstrap](http://getbootstrap.com/) for styling and theming the user interface and 
* [Toastr](https://github.com/CodeSeven/toastr) for notifications.

This document assumes you are familiar with the basics of Knockout and have at least been through the [Knockout tutorial](http://learn.knockoutjs.com/). If you are reading this, you have probably been through the basics of Knockout and now asking yourself how you can develop a full application or even a single page application using Knockout, read on, hopefully you will find some of the answers here. You can view a functioning JSFiddle of the application without AJAX [here](http://jsfiddle.net/omerio/pr04gsta/15/). A fully functional demo is located here [http://knockout-app.appspot.com/](http://knockout-app.appspot.com/)

## Why Knockout

You are probably asking yourself why Knockout and not [jQuery](https://jquery.com/) or [AngularJS](https://angularjs.org/). Well, jQuery can be thought of as a low level library, hence both Knockout and AngularJS use it internally. To implement simple UI functionality that involves showing or hiding elements or dynamically displaying tabular data, the jQuery code can become really mangled and large. As an example see the following two JSFiddles for the same user interface, one using Knockout and the other jQuery:

* Knockout Example - [http://jsfiddle.net/omerio/kzjwq8ah/18/](http://jsfiddle.net/omerio/kzjwq8ah/18/).
* jQuery Example - [http://jsfiddle.net/omerio/9y9a4sep/14/](http://jsfiddle.net/omerio/9y9a4sep/14/). 

Using [Model-View-ViewModel](https://en.wikipedia.org/wiki/Model_View_ViewModel) (MVVM) libraries like Knockout eliminates the need for intermediary code by directly binding the model to the view (the user interface). Knockout is a library whereas AngularJS is a fully fledged framework with advanced features such as [Dependency Injection](https://docs.angularjs.org/guide/di), etc.... Existing jQuery or legacy HTML/JavaScript code can easily be migrated to use Knockout, the same can't be said for AngularJS. For AngularJS you probably have to start afresh.

## Knockout Application Design

A Knockout application needs a [View Model](http://knockoutjs.com/documentation/observables.html) to operate on, there are many design options as to how to implement this view model. First let's define the following elements of a Knockout application:
 
1. The application views or HTML fragments.
2. One or many View Models that represent data retrieved from the server.
3. Components that encapsulate common/reusable HTML fragments.

The following are two possible ways to design a Knockout single page application:

* One View Model for the whole page, optionally using components

![](https://github.com/omerio/knockout-app/blob/master/docs/images/viewmodel1.png)

* Two or more View Models, optionally using components inside and outside these View Models. 

![](https://github.com/omerio/knockout-app/blob/master/docs/images/viewmodel2.png)
 
Each application needs to be thought through and designed first, the option to consider will depend on the application complexity and size. 

## Customer Admin Application

Our example KnockoutJS-App uses the first pattern by having a single `CustomerAdmin` View Model for the whole page which uses a single `service-credits` component. 

![](https://github.com/omerio/knockout-app/blob/master/docs/images/customeradmin1.png)

The application shows a list of `Customer` objects retrieved from the server. The following is the JSON structure for a `Customer` object:

````js
{
    "name": "John Smith",
    "emailAddress": "john.smith@example.com",
    "age": 30,
    "bio": "Lorem ipsum dolor sit amet, posse perpetua cum ut,",
    "services": [{
        "name": "Website Templates",
        "credit": "10"
    }, {
        "name": "Stock Images",
        "credit": "5"
    }]
}
````

Each table row represents a `Customer` and has an action column with the ability to edit or delete the row. When the user selects a row, additional details for the selected `Customer` object are shown underneath. 

Here, the user can edit the bio and services for a particular customer. The `Customer` has a collection of `Service` objects, the `Service` objects are displayed using the `service-credits` component.

## Loading Initial Data

Many of the existing Knockout examples use hardcoded JSON data for the View Model, so the question that immediately comes to mind, how can we load the initial View Model from the server using AJAX?

In our example the document onload function creates an instance of the View Model (`CustomerAdmin`) and binds it to the container `div` which is initially hidden to avoid showing the HTML markup before Knockout bindings are initialized.

````js
$(function () {
    ...
    var admin = new CustomerAdmin($('.container')[0]);
    admin.load(true);
});
````

````html
<div class="container hidden"> 
 ...
</div>
````

The `CustomerAdmin.load` function makes an AJAX call to load the `Customer` objects from the server. Then, on the callback initializes the Knockout bindings on the container `div` passed to the constructor and removes the `hidden` class from it. The `load` function accepts an `initialLoad` flag, when this flag is set to true the function perform an initial loading of customers and binding, when set to false it simply performs a reload of customers. [Toastr](https://github.com/CodeSeven/toastr) library is used for showing notifications to the end user:

````js
this.load = function (initialLoad) {
    toastr.info("Loading customers");
    $.ajax({
        url: "/data/customers",
        method: "GET"
    }).done(function (customers) {
      var customersArray = ko.mapping.fromJS(customers, {
        create: function (options) {
          return new Customer(options.data);
        }
      });
      if (initialLoad) {
        // initial load
        self.customers = customersArray;
        ko.applyBindings(self, element);
        $(element).removeClass('hidden');
      } else {
        // just a refresh
        self.customers(customersArray());
      }
      self.selected(false);
      toastr.success("Customers loaded successfully");
    }).fail(function () {
        toastr.error("Failed to loaded customers");
    });
};
````

The data retrieved from the server is then made observable using the Knockout mapping plugin explained in the next section.

## Knockout Mapping Plugin

When loading data from the server using AJAX none of the data fields are actually observable. When you are simply displaying read only data you probably do not need to make the individual fields observable, in which case you would just use one-way binding. But, if you need to edit this data then you need to make those fields you need to edit observable. This can be done manually by iterating over the data:

````js
for(var i = 0; i < customers.length; i++) {
    var customer = customers[i];
    customer.name = ko.observable(customer.name);
    customer.emailAddress = ko.observable(customer.emailAddress);
    customer.age = ko.observable(customer.age);
    customer.bio = ko.observable(customer.bio);
    customer.edit = ko.observable(false);
}
this.customers = ko.observableArray(customers);
````

Alternatively, the Knockout mapping plugin can be used to automatically make all the fields observable and all the arrays observableArrays. The Knockout mapping plugin can be customized by providing a mapping object. In this example we use this mapping object to customize the creation of the `Customer` and `Service` objects using the `create` function.

````js
self.customers = ko.mapping.fromJS(customers, {
  create: function (options) {
        return new Customer(options.data);
  }
});
````

````js
ko.mapping.fromJS(customer, {
    'services': {
        create: function (options) {
            return new Service(options.data);
        }
    }
}, this);
````

## Implementing the Customers Table

The customers table uses the `foreach` binding to iterate over a collection of customers retrieved from the server. A handler is defined on the click of the table row to set the selected customer:

````html
<tbody data-bind="foreach: customers">
    <tr data-bind="click: $root.setSelected.bind($root, $data)" class="actionable">
    ...
</tbody>        
````

When binding events using Knockout, the event handler will be called with the current context View Model (see the Understanding Context section below) as the first argument and the event object as the second argument. If the event handler is invoked inside the customers foreach binding loop the data argument will be the customer object for the particular row:

````js
function eventHandler(data, event)
````

Bear in mind you need to provide the function name without the round brackets e.g. `setSelected` rather than `setSelected()`, the later will invoke the function immediately rather than as an event handler. 

What if you need to provide custom arguments to the event handler rather than the signature `eventHandler(data, event)` above? in this case you need to use [Function.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) to create a copy of the function with the arguments wired in. The first argument is usually the `this` scope. We have used this technique to bind the click of the table row to the `setSelected` function on the `CustomerAdmin` View Model (`$root.setSelected.bind($root, $data)`) which is currently our root View Model, hence why it's appended with `$root`. `$data` represents the current `Customer` object in the `foreach` iteration. Another example is the `toggleEdit` function (`$root.toggleEdit.bind($root, $data, true)`) invoked when the action buttons are clicked.

## Managing UI State using Boolean View Model Flags

To manage the state of editing a customer we use a boolean flag `edit` on the `Customer` object, based on this flag being true or false certain elements are shown or hidden.

![](https://github.com/omerio/knockout-app/blob/master/docs/images/editcustomer.png)

For example the `name` column toggles between a div or an input field depending on the edit flag. 

````html
<td>
    <div data-bind="text: $data.name, visible: !$data.edit()"></div>
    <input data-bind="value: $data.name, visible: $data.edit" />
</td>
````

This technique will have many hidden input fields for each table row, which might not be the optimal option when there is a large number of customer objects to display, resulting in heavy markup. An alternative technique is to use the [Knockout Virtual Elements](http://knockoutjs.com/documentation/custom-bindings-for-virtual-elements.html) to ensure the input fields are not created if the row isn't currently being edited:

````html
<td>
    <!-- ko ifnot: edit -->
    <div data-bind="text: $data.name"></div>
    <!-- /ko -->

    <!-- ko if: edit -->
    <input data-bind="value: $data.name" />
    <!-- /ko --> 
</td>
````

**Do we need to use $data?** the answer is no, Knockout automatically looks in the customer object for the current row to resolve any bindings and `$data` simply means the current item in the `foreach` binding. We could simply write the above code without `$data` like this and it should still work:

````html
<td>
    <div data-bind="text: name, visible: !edit()"></div>
    <input data-bind="value: name, visible: edit" />
</td>
````

**Why did we write edit in one place and !edit() with round brackets in another?** well as `edit` is a Knockout observable (function), Knockout knows how to deal with it in bindings. But when we prepend it with boolean operators or string concatenation in the HTML markup, Knockout simply evaluates the expression as JavaScript without unwrapping the observables. For example if you have this binding :

````html
<span data-bind="text: 'Edit is ' + edit"></span>
````

This will simply print something like:

> Edit is function d(){if(0< arguments.length)return ...

So the correct way is to manually unwrap the observable before negating or concatenating it

````html
<span data-bind="text: 'Edit is ' + edit()"></span>
````

Which correctly prints out:

> Edit is false

## Coding Components

[Knockout components](http://knockoutjs.com/documentation/component-overview.html) can be used to create encapsulated HTML components or widgets. This promotes reuse and avoids duplicating HTML fragments and View Models. For our Customer Admin application there is a need to manage customers' services. This is created as a component and can be reused in other parts of the user interface or in other apps.

````js
ko.components.register('service-credits', {
    template: {
        //element: 'service-credits-template'
        fromUrl: 'serviceCredits.html'
    },
    viewModel: function (params) {
        this.customer = params.customer;
        ...
    }
});
````

The Knockout component's template can be a string of markup, an id of an existing element or others as explained the [documentation](http://knockoutjs.com/documentation/component-registration.html#specifying-a-template). When the template markup is very large it's difficult adding it as a string and difficult to maintain. Luckily Knockout provides the ability to add custom template loaders so the template for a component can be loaded remotely from a file using AJAX. This approach ensures the template is only loaded when the component is initialized. For example in our case, the `serviceCredits.html` component template file is only requested when the user selects a row on the customers table. Here is a definition of a custom component [template loader](http://knockoutjs.com/documentation/component-loaders.html) that uses AJAX to load component templates from the server. 

### Template afterRender Function
The Knockout template provides an ability to bind an `afterRender` callback. This can be used if you need to do further processing of the generated component markup after Knockout has finished processing and rendering it. This is handy if you use libraries like [jQuery UI](https://jQueryui.com/) to create widgets after the Knockout template is rendered. 

**Note:** Knockout remembers the location of each bound HTML element, libraries like jQuery UI do actually modify the DOM so you might experience issues where after initializing jQuery, Knockout bindings don't work anymore.

````html
<!-- ko template: {afterRender: afterRender } -->
<ul class="list-group">
    ...
</ul>
<!-- /ko -->
````

When creating reusable components it's best to avoid hard coding HTML element ids because if you have two components on the same page you will end up with ids clash. If you need to have ids for your Knockout component markup then you can generate the ids dynamically based on a base id that is provided as a parameter to the component:

````html
<div attr: {'id': id + 'container'}>
   ...
</div>
````

## Managing inline editing

The `service-credits` component implements click to inline-edit capability. This is achieved by using the Knockout `event` and `click` bindings without the need to use any jQuery event binding. 

![](https://github.com/omerio/knockout-app/blob/master/docs/images/editservices.png)

````html
<input data-bind="value: credit, visible: edit, 
        click: startEdit, event: {blur: stopEdit}" 
        class="badge-edit" type="number" />
````

jQuery event binding requires that elements are selected first which forces us into either adding ids or using custom classes to select those elements. With Knockout the binding is put where it needs to be, on the element itself.

````js
$(element).click(function () {
    $(element).addClass('editing');
    $(input).focus().select();
});
$(input).blur(function () {
    $(element).removeClass('editing');
});
````

The `startEdit` and `stopEdit` functions in the `Service` object provide the ability to start editing when the user clicks on either the service name or credit. The editing is stopping when the `blur` event is triggered on either the service name or credit inputs. We implement a timeout function to cater for the fact that the user might click on the name input, then on the credit input, in this case we obviously do not want to cancel the edit on the `blur` of either of them.

````js
this.startEdit = function (service, event) {
    if (service.stopping) {
        clearTimeout(service.stopping);
    }
    service.edit(true);
    var element = event.target;
    switch (element.tagName) {
    case "SPAN":
        $(element).next().focus();
        break;
    case "INPUT":
        $(element).focus();
        break;
    }
};


this.stopEdit = function (service) {
    service.stopping = setTimeout(function () {
        service.edit(false);
    }, 200);
};
````

## Adding New Items

With Knockout, adding new items to observable arrays is as easy as adding new objects to those arrays. The following code adds a new customer to the customers observable array:

````js
this.add = function () {
    var customer = {
        name: ko.observable(''),
        emailAddress: ko.observable(''),
        age: ko.observable(0),
        bio: ko.observable('new customer'),
        edit: ko.observable(true),
        services: ko.observableArray()
    };
    this.customers.push(customer);
};
````

The following code adds a new service to the services observable array:

````js
this.addService = function () {
    if (!this.customer().services) {
        this.customer().services = ko.observableArray();
    }
    this.customer().services.push(new Service({
        "name": "",
        "credit": "1"
    }));
};
````

## Saving Data

The customer admin example provides a save button for the user to interactively save their changes. This could be implemented as an automated save each time the user modifies any of the customer details. To send the View Model to the server we need to first unwrap all the Knockout observables. This can be achieved by using the `ko.toJSON` function. Notice we call `self.load(false)` to reload the customers after saving the data, this is to ensure what is shown on the user interface reflects what is saved on the server.

````js
this.save = function () {
    var customers = ko.toJSON(this);
    toastr.info("Saving customers");
    this.saving(true);
    $.ajax({
        url: "/data/customers",
        method: "POST",
        data: {
            customers: customers
        }
    }).done(function (status) {
        if (status && status.success) {
            toastr.success("Customers saved successfully");
            self.load(false);
        } else {
            toastr.error("Failed to save customers");
        }
        self.saving(false);
    }).fail(function () {
        toastr.error("Failed to save customers");
        self.saving(false);
    });
};
````

Notice we have used a reference `self` to refer to the View Model instance inside the AJAX callback functions. This is declared inside the `CustomerAdmin` object:

````js
var self = this;
````

### A gotcha with re-assigning observables
If you remember in the `load` function when the customer data is reloaded after the initial load we have done something like:

````js
if (initialLoad) {
  // initial load
  ...
} else {
  // just a refresh
  self.customers(customersArray());
}
````

We have set the observable array by calling `self.customers(customersArray())`, if we were to set the new customers array like this `self.customers = customersArray` Knockout would still remember the old value that was bound to the user interface and the application would stop functioning as expected. So remember if your View Model attributes are already observables then call the observable function to assign new values rather than re-assigning the attributes to new observables.

Why did we do `customerArray()` instead of just `customerArray`?, well this is because `customerArray` is constructed using the Knockout mapping plug and will be an observableArray so we are just unwrapping it into an array.


## Understanding Context (Scope)

Understanding [context](http://knockoutjs.com/documentation/binding-context.html) is really key to grasping the Model-View-ViewModel (MVVM) concepts. A really useful Chrome extension that can help with inspecting the current Knockout context is the [Knockout context debugger](https://chrome.google.com/webstore/detail/Knockout-context-debugg/oddcpmchholgcjgjdnfjmildmlielhof?utm_source=chrome-app-launcher-info-dialog). Using the debugger we are able to inspect the different contexts in the customer admin application and view the values of the built in Knockout variables such as `$data`, `$parent`, `$parents`, `$parentContext` and `$index`.

The root ViewModel context is marked with the red rectangle in the screenshot below. This context can be referenced in bindings using the `$root` Knockout variable. The `$data` Knockout variable always references the View Model for the current context. The table below explains the various contexts in the customer admin application:


Color | Context object | Description
------|----------------|-------------
Red | `CustomerAdmin` | The root View Model
Blue | `Customer` | The View Model of each of the customers as a result of using the foreach binding
Green | `Customer` | The View Model of the currently selected customer. A reference to the selected customer object is saved on the root View Model (`CustomerAdmin`)
Orange | `ko.components.register.viewModel` |The View Model of the service-credits component
Yellow | `Service` | The View Model of each of the services (of the selected customer) as a result of using the foreach binding


![](https://github.com/omerio/knockout-app/blob/master/docs/images/customeradmin3.png)

## Where to next?

The following two article are a good read before you start developing complex applications in Knockout:

* [The Top 10 Mistakes That KnockoutJS Developers Make](https://www.airpair.com/knockout/posts/top-10-mistakes-knockoutjs)
* [Developing large scale KnockoutJS applications](http://blog.scottlogic.com/2014/02/28/developing-large-scale-knockoutjs-applications.html)

