
function Transform(aSource, aTransform, aScope)
{
	aScope = aScope || {}

	console.log("Entered Transform. Source: " + JSON.stringify(aSource) + ", Transform: " + JSON.stringify(aTransform) + ", Scope = " + JSON.stringify(aScope));

    var ltargetvalue = null;
    
    var ltargetlist = TransformList(aSource, aTransform, aScope);

    if (ltargetlist)
        ltargetvalue = ltargetlist[0];
    
    return ltargetvalue;
}

function TransformList(aSource, aTransform, aScope)
{
	console.log("Entered TransformList. Source: " + JSON.stringify(aSource) + ", Transform: " + JSON.stringify(aTransform) + ", Scope = " + JSON.stringify(aScope));

    var ltargetlist = []
    
    if (IsLiteralString(aTransform))
	{
        var ltargetvalue = ProcessLiteralString(aSource, aTransform, aScope);
        ltargetlist.push(ltargetvalue);
	}
    else if (IsLiteralValue(aTransform))
	{
        ltargetlist.push(aTransform);
	}
    else if (IsLiteralArray(aTransform))
	{
        var ltargetvalue = []
        aTransform.forEach(
			function(aTransformElement)
			{
		        var lchildTargetList = TransformList(aSource, aTransformElement, aScope);
		        ltargetvalue.push.apply(ltargetvalue, lchildTargetList)
			}
		);
        ltargetlist.push(ltargetvalue)
	}
    else if (IsLiteralDict(aTransform))
	{
        var ltargetvalue = {};
        for (var lkey in aTransform)
		{
			if (aTransform.hasOwnProperty(lkey))
			{
				var lvalue = aTransform[lkey];
		        var lchildTargetValue = Transform(aSource, lvalue, aScope);
		        ltargetvalue[lkey] = lchildTargetValue || null;
			}
		}
        ltargetlist.push(ltargetvalue);
	}
    else if (IsSimpleRef(aTransform))
	{
        var lselectorexpression = GetSelectorExpressionFromSimpleRef(aTransform);
        ltargetlist = EvaluateSelectorExpression(aSource, lselectorexpression, aScope);
	}
    else if (IsComplexRef(aTransform))
	{        
        // need to remove "_lit_" prefixes here.
		lsource = RemoveLiteralPrefixFromDict(aSource)
        
        var lselectorexpression = aTransform["ref"];
        var lselectorsourcelist = EvaluateSelectorExpression(lsource, lselectorexpression, aScope)
        
        if ("transform" in aTransform)
		{
            // we're going to transform every selected object
            for (lindex in lselectorsourcelist)
			{
				var lselectorsourceobject = lselectorsourcelist[lindex];
                if ("id" in aTransform)
				{
                    lchildscope = {}
					for (var lkey in aScope)
					{
						lchildscope[lkey] = aScope[lkey];
					}
                    lchildscope[aTransform["id"]] = lselectorsourceobject;
				}
                else
				{
                    lchildscope = aScope
                }

                lchildTargetList = TransformList(lsource, aTransform["transform"], lchildscope)
				ltargetlist.push.apply(ltargetlist, lchildTargetList)
			}
		}
        else
		{
            // no transform, just return all the source objects we found.
            ltargetlist = lselectorsourcelist
		}
	}
    
    return ltargetlist
}

function EvaluateSelectorExpression(aSource, aSelectorExpression, aScope)
{
	aScope = aScope || {}

    var lselectedlist = null;
    
    if (aSelectorExpression)
	{
        var lselectedlist = []
        
        var lselectorterms = TokenizeSelectorExpression(aSelectorExpression)
        
        if (lselectorterms)
		{
            lselectedlist = EvaluateSelector(aSource, lselectorterms[0], lselectorterms.slice(1), aScope)
		}
        else
		{
            lselectedlist.push(aSource)
		}
	}
        
    return lselectedlist
}

function EvaluateSelector(aSource, aSelectorTerm, aFollowingSelectorTerms, aScope)
{
    var llocalselectedlist = [];
	
	lselectortermtype = null;
    lselectortermvalue = null;

    ltoken = ParseSelectorTerm(aSelectorTerm);

	if (ltoken)
	{
		lselectortermtype = ltoken["type"];
		lselectortermvalue = ltoken["value"];
	}    

    if (lselectortermtype == ".")
	{
        if (IsLiteralDict(aSource) && lselectortermvalue in aSource)
		{
            llocalselectedlist.push(aSource[lselectortermvalue]);
		}
	}
    else if (lselectortermtype == ">")
	{
        llocalselectedlist = GetObjectsByNameRecursive(aSource, lselectortermvalue);
	}
    else if (lselectortermtype == "@")
	{
        llocalselectedlist = ApplyIndexExpressionToArray(aSource, lselectortermvalue);
	}
    else if (lselectortermtype == "!")
	{
        if (IsLiteralDict(aScope) && (lselectortermvalue in aScope))
            llocalselectedlist.push(aScope[lselectortermvalue]);
    }
       
    var lselectedlist = [];

    if (aFollowingSelectorTerms && (aFollowingSelectorTerms.length > 0))
	{
        var lnextSelectorTerm = aFollowingSelectorTerms[0];
        var lnextFollowingSelectorTerms = aFollowingSelectorTerms.slice(1);
        llocalselectedlist.forEach(
			function(llocalselectedobject)
			{
		        var lchildselectedlist = EvaluateSelector(llocalselectedobject, lnextSelectorTerm, lnextFollowingSelectorTerms, aScope);
				lchildselectedlist.forEach(
					function(lchildselectedobject)
					{
		                if (!(lchildselectedobject in lselectedlist))
			                lselectedlist.push(lchildselectedobject);
					}
				);
			}
		);
	}
    else
	{
        llocalselectedlist.forEach(
			function(llocalselectedobject)
			{
		        if (!(llocalselectedobject in lselectedlist))
		            lselectedlist.push(llocalselectedobject)
			}
		);
    }

    return lselectedlist
}

function ProcessLiteralString(aSource, aLiteralString, aScope)
{
    var retval = null;

    if (IsLiteralString(aLiteralString))
	{
        if (ContainsLiteralPrefix(aLiteralString))
		{
            retval = RemoveLiteralPrefixFromString(aLiteralString);
		}
        else
		{
			console.log("warning: selector substitutions in strings not yet implemented");
			retval = aLiteralString;			
/*
            // do selector substitutions here
            var lworkingCopyOfString = aLiteralString
            
            # find a substitution
            import re
            
            #lregex = re.compile("({{.*?}})")
            lregex = re.compile("{{(.*?)}}")
            lmatch = lregex.search(lworkingCopyOfString)
            while lmatch:
                lselectorExpression = lmatch.group(1)
                lselectedlist = EvaluateSelectorExpression(aSource, lselectorExpression, aScope)
                if not lselectedlist:
                    lreplacevalue = ""
                else:
                    lreplacevalue = unicode(lselectedlist[0])
                
                lworkingCopyOfString = lworkingCopyOfString.replace("{{%s}}" % lselectorExpression, lreplacevalue)
                #
                # get next match
                lmatch = lregex.search(lworkingCopyOfString) # should now be a new string
            retval = lworkingCopyOfString
*/
		}
	}

    return retval;
}

function TokenizeSelectorExpression(aSelectorExpression)
{
    var retval = null;

    if (aSelectorExpression)
	{
        retval = []

        lselectorExpressionTrimmed = aSelectorExpression.trim();

        if (lselectorExpressionTrimmed)
		{
			// should do better whitespace support
            retval = lselectorExpressionTrimmed.split(' ');
		}
	}

    return retval;
}

function ParseSelectorTerm(aSelectorTerm)
{
    var lselectortermtype = "";
    var lselectortermvalue = "";

    if (aSelectorTerm)
	{
        lselectortermtype = aSelectorTerm[0];
        lselectortermvalue = aSelectorTerm.slice(1);
	}
        
    return {"type": lselectortermtype, "value": lselectortermvalue};
}    

function GetObjectsByNameRecursive(aSource, aName)
{
    var lselectedobjects = [];
    
    if (IsLiteralDict(aSource))
	{
        for (var lkey in aSource)
		{
			var lvalue = aSource[lkey];
            if (lkey == aName)
			{
                lselectedobjects.push(aSource[aName]);
			}
            else
			{
		        lselectedobjects.push.apply(lselectedobjects, GetObjectsByNameRecursive(lvalue, aName));
			}
		}
	}
    else if (IsLiteralArray(aSource))
	{
        for (var lindex in aSource)
		{
			var lchild = aSource[lindex]
		    lselectedobjects.push.apply(lselectedobjects, GetObjectsByNameRecursive(lchild, aName));
		}
	}
    
    return lselectedobjects
}

function ApplyIndexExpressionToArray(aSource, aIndexExpression)
{
    var retval = [];

    var lindexTerms = aIndexExpression.split(":");

    if (lindexTerms && (lindexTerms.length > 0))
	{
        var lstart = 0;
        var lend = 0;
//        var lstep = 0;

        if (lindexTerms.length >= 1)
		{
            lstart = parseInt(lindexTerms[0]);
		}
        if (lindexTerms.length >= 2)
		{
            lend = parseInt(lindexTerms[1]);
		}
        
/*
        if len(lindexTerms) >= 3:
            try:
                lstep = int(lindexTerms[2])
            except:
                pass


        if not lstep:
            lstep = 1;
*/

        if (lindexTerms.length == 1)
		{
			var lresult = aSource[lstart];
			if (lresult)
	            retval.push(lresult);
		}
        else if (lindexTerms.length >= 1)
		{
			if (isNaN(lend))
				retval = aSource.slice(lstart);
			else
				retval = aSource.slice(lstart, lend)
		}
	}

    return retval;
}





function ContainsLiteralPrefix(aString)
{
    var retval = null;
    
    retval = IsString(aString) && (aString.slice(0, 4) == "lit=");

    return retval;
}
    
function RemoveLiteralPrefixFromString(aString)
{
    var retval = null;
    
    if (IsString(aString))
	{
        if (aString.slice(0, 4) == "lit=")
		{
            retval = aString.slice(4);
		}
        else
		{
            retval = aString;
		}
	}

    return retval;
}

function RemoveLiteralPrefixFromDict(aDict)
{
    retval = null;
    
    if (IsDict(aDict))
	{
        retval = {};

        for (var lkey in aDict)
		{
			if (aDict.hasOwnProperty(lkey))
			{
				var lvalue = aDict[lkey];
		        if (lkey.slice(0, 5) == "_lit_")
				{
		            retval[lkey.slice(5)] = lvalue;
				}
		        else
				{
		            retval[lkey] = lvalue;
				}
			}
		}
	}

    return retval
}


function GetSelectorExpressionFromSimpleRef(aSimpleRefString)
{
    var retval = aSimpleRefString.substring(1);

    return retval;
}

//************************************************


function IsLiteralValue(aTransform)
{
    var retval = IsLiteralString(aTransform) ||
            IsLiteralNumber(aTransform) ||
            IsLiteralBool(aTransform) ||
            IsLiteralNull(aTransform);
        
    return retval
}

function IsLiteralString(aTransform)
{
    var retval = (typeof aTransform == 'string' || aTransform instanceof String);
    
    if (retval)
	{
		// a string that starts with # is a SimpleRef.
        retval = ! (aTransform[0] == "#"); 
	}
    
    return retval
}

function IsString(aTransform)
{
    var retval = (typeof aTransform == 'string' || aTransform instanceof String);

    return retval
}

function IsLiteralNumber(aTransform)
{
    var retval = (typeof aTransform == 'number' || aTransform instanceof Number);
    
    return retval
}

function IsLiteralBool(aTransform)
{
    var retval = (typeof aTransform == 'boolean' || aTransform instanceof Boolean);
    
    return retval
}

function IsLiteralNull(aTransform)
{
    var retval = aTransform === null;
    
    return retval
}

//# also allow tuples here <-- comment from bOTL.py. Necessary?
function IsLiteralArray(aTransform)
{
    var retval = aTransform.constructor == Array;
    
    return retval
}

function IsLiteralDict(aTransform)
{
    var retval = aTransform.constructor == Object;
    
    if (retval)
	{
	// if it has "ref" in it, then it's a complex transform
        retval = ! ("ref" in aTransform); 
	}
    
    return retval
}

function IsDict(aTransform)
{
    var retval = aTransform.constructor == Object;
  
    return retval
}

function IsSimpleRef(aTransform)
{
    var retval = IsString(aTransform);
    
    if (retval)
	{
        // a string that starts with "#" is a SimpleRef.
        retval = (aTransform[0] == "#");
	}
    
    return retval
}

function IsComplexRef(aTransform)
{
    var retval = IsDict(aTransform)
    
    if (retval)
	{
        retval = "ref" in aTransform;
	}
    
    return retval
}


